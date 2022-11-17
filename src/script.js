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

let hasPhotoBeenSeen = false;
let isDateTimeOriginalSet = false;
let filename;
let imgFile;
let imgSize;

setDtoButton.addEventListener("click", function(e) {
    if (!dtoInput.checkValidity()) {
        return
    }
    console.log(dtoInput.checkValidity())
    checkDTOInput();
    confirmDtoSpan.setAttribute("style", "visibility:visible;");
})


imageInput.addEventListener('change', function (e) {
    imgFile = e.target.files[0];
    imgSize = imgFile.size / 1000;
    filename = imgFile.name;
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
});

function drawCanvas(img) {
    let MAX_WIDTH = 750;
    let MAX_HEIGHT = 750;
    let width = img.width;
    let height = img.height;

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

    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    
    // consider playing around with these :)
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = true;

    ctx.drawImage(img, 0, 0, width, height);

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
    EXIF.getData(file, function() {
        let allMetaData = EXIF.getAllTags(this);
        populateExifTable(allMetaData)
    });
}


function populateExifTable(data) {
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
        foundOrNot.textContent = "No EXIF found";
    } else {
        foundOrNot.textContent = "EXIF was found and removed!";
    }
    foundOrNot.setAttribute("style", "visibility:visible");
}


function saveScrubbedImage(url, filename) {
    saveImageBtn.href = url;
    saveImageBtn.download = "scrubbed_" + filename;
}


function clearTable() {
    document.getElementById("exif-table-body").innerHTML = "";
}


function clearDTOInput() {
    dtoInput.value = "";
    confirmDtoSpan.setAttribute("style", "visibility:hidden;");
}


function checkDTOInput() {
    let dto = dtoInput.value;
    if (!dto) {
        return
    }
    prepAndSetNewPhoto(dto);
}


function manageDTODivVisibility(imageType) {
    if (imageType === "image/jpeg") {
        dtoDiv.setAttribute("style", "visibility:visible");
    } else {
        dtoDiv.setAttribute("style", "visibility:hidden");
    }
}


function prepAndSetNewPhoto(dto) {    
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


function dataURLtoBlob(dataURL, fileType) {
    let binary = atob(dataURL.split(',')[1]);
    let array = [];
    for(var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {type: fileType});
}


function calculateSizeReduction(sizePre, sizePost) {
    return (sizePre - sizePost) / sizePre * 100;
}