// 100% hjemmelavet af en 90% selvlært og 100% amatøragtig kundeservicemedarbejder
// hvad er best practice? ̿̿ ̿̿ ̿̿ ̿'̿'\̵͇̿̿\з= ( ▀ ͜͞ʖ▀) =ε/̵͇̿̿/’̿’̿ ̿ ̿̿ ̿̿ ̿̿

const imageInput = document.querySelector("#image-input");
const saveImageBtn = document.querySelector("#save-image-button");
const canvas = document.querySelector("#img-canvas");
const cleanTable = document.querySelector("#main-table")
const foundOrNot = document.querySelector("#found-or-not");
const dtoInput = document.querySelector("#dto-input");
const setDtoButton = document.querySelector("#set-dto-btn");
const dtoDiv = document.querySelector("#custom-dto-div");
const confirmDtoSpan = document.querySelector("#confirm-dto-set");

const sizeDiv = document.querySelector("#display-file-sizes");
const sizeBeforeSpan = document.querySelector("#size-before");
const sizeAfterSpan = document.querySelector("#size-after");
const sizeReductionSpan = document.querySelector("#size-reduction");

let imgFile;
let hasPhotoBeenSeen = false;
let isDateTimeOriginalSet = false;

setDtoButton.addEventListener("click", function(e) {
    checkDTOInput();
    //confirmDtoSpan.textContent = "DateTimeOriginal was set!"
    confirmDtoSpan.setAttribute("style", "visibility:visible;");
})


imageInput.addEventListener('change', function (e) {
    // det er helt sindssygt pinligt, hvis du ikke forstår følgende
    imgFile = e.target.files[0];
    imgSize = imgFile.size / 1000;
    let filename = imgFile.name;
    let reader = new FileReader();
    reader.onload = function (e) {
        let img = document.createElement("img");
        img.onload = function() {
            if (hasPhotoBeenSeen) {
                clearTable();
                clearDTOInput();
            }

            manageDTODivVisibility(imgFile.type);
            hasPhotoBeenSeen = true;
            drawCanvas(img);
            getExif(imgFile);

            saveImageBtn.setAttribute("style", "visibility:visible");
            document.querySelector("#exif-table-text").textContent = "EXIF";
            document.querySelector("#value-table-text").textContent = "VALUE";
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(imgFile);

    // easy læsning her
    function drawCanvas(img) {
        let MAX_WIDTH = 750;
        let MAX_HEIGHT = 750;

        let width = img.width;
        let height = img.height;

        // næste 11 linjer er tyvstjålet. Har ikke forsøgt at forstå det, but it works wonders <3
        if (width > height) {
            if (width > MAX_WIDTH) {
                height = height * (MAX_WIDTH / width);
                width = MAX_WIDTH;
            }
        } else {
            if (height > MAX_HEIGHT) {
                width = width * (MAX_HEIGHT / height);
                height = MAX_HEIGHT;
            }
        }

        // ved slet ikke hvorfor jeg kommenterer
        // som om jeg nogensinde kommer ind og læser kommentarerne igennem
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        
        let ctx = canvas.getContext("2d");
        
        // prøv evt. at lege med lækkerheden vha. disse hohoho
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = true;

        ctx.drawImage(img, 0, 0, width, height);

        /* 
        1) lav en URL 2) sæt canvas' src til URL'en og 3) profit (her refererer "profit" ikke til likvider -
        ... i stedet agerer det slang for, at vi nu endelig er nået til at kunne gemme billedet; at fuldene missionen)
        */
        let canvasPhotoUrl = canvas.toDataURL(imgFile.type);
        document.getElementById("preview").src = canvasPhotoUrl;
        saveScrubbedImage(canvasPhotoUrl, filename);
        let newFileSize = dataURLtoBlob(canvasPhotoUrl, imgFile.type).size / 1000;
        let sizeReduction = calculateSizeReduction(imgSize, newFileSize);

        sizeBeforeSpan.textContent = imgSize + " KB";
        sizeAfterSpan.textContent = newFileSize + " KB";
        sizeReductionSpan.textContent = Math.round(sizeReduction) + "%";
        sizeDiv.setAttribute("style", "visiblity:visible;");


    }


    function getExif(file) {
        // henter hella EXIF-data med en _anelse_ assistance fra ./exif.js (https://github.com/exif-js/exif-js)
        EXIF.getData(file, function() {
            let allMetaData = EXIF.getAllTags(this);
            populateExifTable(allMetaData)
        });
    }


    function populateExifTable(data) {
        /* 
        et kort (langt) summary: 
         1) Hiv fat i exif-tabellen (<tbody>), som skal populeres
         2) Loop gennem "data"-objektet (altså al billedets EXIF-data)
          2.1) ja, jeg skipper "thumbnail" fordi den giver [object Object] på klassisk JavaScript-vis, og jeg orker ikke at gøre noget ved det - så den skipper vi :)
         3) Lav en række -> Lav celler til rækken -> Lav tekstnoderne (spans) til cellerne -> Tilføj hhv. key og value til tekstnoderne
         4) Tilføj tekstnoderne til cellerne -> Tilføj cellerne til rækken -> Tilføj rækken til tabellens krop (fordi tbody)
          4.1) Hvis du undrer dig over brug af <thead> og <tbody> kan jeg oplyse, at man blot kan sætte tbody.innerHTML="" og dermed "resette" hele tabellens indhold uden at skulle fjerne rækker mv. 
           4.1.1) Ret smart!
            4.1.1.1) Det var i hvert fald det første, jeg fandt på internettet
             4.1.1.1.1) Og det virkede!
              4.1.1.1.1.1) Er det her meta?
               4.1.1.1.1.1.1) ...data?
                4.1.1.1.1.1.1.1) Nu er det sgu fjollet, sorry

        */
        const table = document.querySelector("#exif-table-body");
        rowCounter = 0;

        for (let [key, value] of Object.entries(data)) {
            if (key == "thumbnail") {
                continue;
            } else {
                rowCounter++;
            }

            let row = document.createElement("tr");
            let leftCol = document.createElement("td");
            let rightCol = document.createElement("td");
            

            // uuh tror nok at innerHTML er giga XSS risk
            // <script>alert("men okay, risikoen er sgu da nok lidt begrænset, ikke sandt?")</script>
            //leftCol.innerHTML = key;
            //rightCol.innerHTML = value;
            
            // laver sgu lige spans i stedet for at vise fremtidsandreas, at jeg (du) er god
            // *klapper dig (mig)*
            let leftColSpan = document.createElement("span");
            let rightColSpan = document.createElement("span");
            
            leftColSpan.textContent = key;
            rightColSpan.textContent = value;


            leftCol.setAttribute("class", "exif-key-class");
            rightCol.setAttribute("class", "exif-value-class");

            leftCol.appendChild(leftColSpan);
            rightCol.appendChild(rightColSpan);

            row.appendChild(leftCol);
            row.appendChild(rightCol);
            table.appendChild(row);
        }

        if (!rowCounter) {
            // DA: Ingen EXIF fundet
            foundOrNot.textContent = "No EXIF found";
        } else {
            // DA: EXIF blev fundet og fjernet!
            foundOrNot.textContent = "EXIF was found and removed!";
        }
        // DA: fundetEllerEj.sætAttribut("stil", "synlighed:synlig")semikolon
        foundOrNot.setAttribute("style", "visibility:visible");
        // (kommentaren ovenfor var just en vits, og de to yderligere "DA:"-oversættelser var tilmed intet andet end et setup til denne vits
        // jeg (du) kan godt engelsk
        // men det ved du (jeg) jo godt
        // at du (jeg) stadig læser med er ufatteligt
        // men måske mere ufatteligt, at jeg (du) stadig skriver kommentarer
        // wtf
        // det er bare så der kommer flere linjer "kode"; så kan jeg fortælle folk, at jeg har skrevet adskillelige hundrede linjer kode på nærmest ingen tid

    }
    

    function saveScrubbedImage(url, filename) {
        saveImageBtn.href = url;
        saveImageBtn.download = "scrubbed_" + filename;
    }

    function clearTable() {
        //*ADVRSEL* ualmindeligt avanceret kode i denne funktion, hvis man ikke har læst ovenstående kommentarer
        document.getElementById("exif-table-body").innerHTML = "";
    }
});


function clearDTOInput() {
    // Resetter inputfeltet til custom DTO value, og skjuler teksten der siger, at en værdi blev sat.
    dtoInput.value = "";
    confirmDtoSpan.setAttribute("style", "visibility:hidden;");
}

function checkDTOInput(e) {
    // Checker om der er en værdi i DTO-input-feltet. Hvis der er, ruller vi videre med ny funktion og ellers returner vi bare.
    let dto = dtoInput.value;
    
    if (!dto) {
        return
    }
    prepAndSetNewPhoto(dto);
}
function manageDTODivVisibility(imageType) {
    // Hvis vi har fat i en jpg/jpeg-fil, viser vi dto-elementerne. 
    /// Hvis ikke, skjuler vi dem.
    if (imageType === "image/jpeg") {
        dtoDiv.setAttribute("style", "visibility:visible");
    } else {
        dtoDiv.setAttribute("style", "visibility:hidden");
    }
}

function prepAndSetNewPhoto(dto) {    
    // Laver et obj til EXIF, tilføjer ønskede værdi til dto-tagget via piexif.js -
    // gemmer dto-tagget og dens værdi i billedets exif, og ændrer url på save-knappen til at matche det nye billede - 
    // såfremt der rent faktisk står noget i input-feltet til at sætte custom DTO value

    oldSaveImageBtnLink = saveImageBtn.href;
    let exif = {}
    exif[piexif.ExifIFD.DateTimeOriginal] = dto;
    let exifObj = {"Exif": exif};
    let exifStr = piexif.dump(exifObj);
    let reader = new FileReader();
    reader.onload = function(e) {
        let inserted = piexif.insert(exifStr, e.target.result);
        let image = new Image();
        image.src = inserted;
        saveImageBtn.href = inserted;
        saveImageBtn.download = "DTO_Scrubbed_" + imgFile.name;
    };
    reader.readAsDataURL(imgFile);
}


// Den her er sgu semi-stjålet og skal blot bruges til at udregne den kommende filstørrelse på det nye billede
function dataURLtoBlob(dataURL, fileType) {
    
    // Decode the dataURL
    let binary = atob(dataURL.split(',')[1]);
    
    // Create 8-bit unsigned array
    let array = [];
    for(var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    
    // Return Blob object
    return new Blob([new Uint8Array(array)], {type: fileType});
}

function calculateSizeReduction(sizePre, sizePost) {
    // tror den ehdder (startvaerdi - slutvaerdi) / startværdi * 100
    return (sizePre - sizePost) / sizePre * 100;
}