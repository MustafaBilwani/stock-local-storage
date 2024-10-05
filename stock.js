
var comingQty = document.getElementById('comingQty');
var comingPrice = document.getElementById('comingPrice');
var comingNote = document.getElementById('comingNote');
var goingQty = document.getElementById('goingQty');
var goingPrice = document.getElementById('goingPrice');
var goingNote = document.getElementById('goingNote');
var comingProduct = document.getElementById('comingProduct');
var goingProduct = document.getElementById('goingProduct');
var goingDate = document.getElementById('goingDate');
var comingDate = document.getElementById('comingDate');
var stockDiv = document.getElementById('stockDiv');
var itemStockDivHtml = '';
var itemStockTableHtml = '';
let index = 0;
var products = [];
var productStockTotal = {};
var productCurrentStockDetail = {};
var productStockDetail = {};
var updateProduct = '';
var oldProduct = '';
updateDate();
loadFromLocalStorage();

function exportToExcel() {
    var workbook = XLSX.utils.book_new();

    // Convert productStockDetail to an array of arrays
    var sheetData = [['Product Name', 'Stock', 'Price']];
    products.forEach(product => {
        var stockDetails = productCurrentStockDetail[product];
        stockDetails.forEach(detail => {
            sheetData.push([product, detail.quantity, detail.price]);
        });
    });

    var worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");

    // Create Excel file and trigger download
    XLSX.writeFile(workbook, 'stock_data.xlsx');
}


function importExcel() {
    var fileInput = document.getElementById('excelFileInput');
    var file = fileInput.files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, {type: 'array'});

        // Assuming the data is in the first sheet
        var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        var sheetData = XLSX.utils.sheet_to_json(firstSheet, {header: 1}); // Convert sheet to JSON array

        processImportedData(sheetData);
    };

    reader.readAsArrayBuffer(file);
}

function processImportedData(sheetData) {
    sheetData.forEach(row => {
        var [productName, stock, price] = row;
        // Assuming the columns are Product Name, Stock, Price
        if (!products.includes(productName)) {
            products.push(productName);
            productStockTotal[productName] = parseInt(stock);
            productCurrentStockDetail[productName] = [{quantity: parseInt(stock), price: parseFloat(price)}];
            productStockDetail[productName] = [];
            updateUIAfterAddingProduct(productName);
        }
    });
    saveToLocalStorage(); // Save imported data
}



function deleteProduct(productName) {
    const index = products.indexOf(productName); // Find index of the product
    if (index !== -1) { // Check if the product exists in the array
        products.splice(index, 1); // Remove the product from the array
        saveToLocalStorage();
    }
}

function loadFromLocalStorage() {
    const savedProducts = JSON.parse(localStorage.getItem('products'));
    const savedStockTotal = JSON.parse(localStorage.getItem('productStockTotal'));
    const savedCurrentStockDetail = JSON.parse(localStorage.getItem('productCurrentStockDetail'));
    const savedStockDetail = JSON.parse(localStorage.getItem('productStockDetail'));

    if (savedProducts) {
        products = savedProducts;
        productStockTotal = savedStockTotal || {};
        productCurrentStockDetail = savedCurrentStockDetail || {};
        productStockDetail = savedStockDetail || {};

        products.forEach(product => {
            updateUIAfterAddingProduct(product);

            // Populate stock detail table
            if (productStockDetail[product]) {
                productStockDetail[product].forEach(detail => {
                    const stockTable = document.getElementById(`${product}StockTable`);
                    stockTable.innerHTML += `<tr>
                        <td>${detail.date || ''}</td>
                        <td>${detail.note || ''}</td>
                        <td>${detail.coming || ''}</td>
                        <td>${detail.going || ''}</td>
                        <td>${detail.price || ''}</td>
                        <td>${detail.purchasingAmount || ''}</td>
                    </tr>`;
                });
            }
        });
    }
}

function saveToLocalStorage() {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('productStockTotal', JSON.stringify(productStockTotal));
    localStorage.setItem('productStockDetail', JSON.stringify(productStockDetail));
    localStorage.setItem('productCurrentStockDetail', JSON.stringify(productStockDetail));
}
function displayProduct() {
    if(oldProduct != '') {
        document.getElementById(oldProduct + `StockDiv`).hidden = true;
    }
    var currentProduct = document.getElementById('productSelect').value;
    document.getElementById(currentProduct + `StockDiv`).hidden = false;
    oldProduct = currentProduct;
}
function addProduct() {
    var productName = document.getElementById('addProductInput').value;
    document.getElementById('addProductInput').value = '';
    productName = productName.trim().replace(/\s+/g, ' ');
    if (productName == '') { return false; }

    if (products.includes(productName)) {
        alert('Product already exists');
        return false;
    }

    products.push(productName);
    productStockTotal[productName] = 0;
    productCurrentStockDetail[productName] = [];
    productStockDetail[productName] = [];
    
    updateUIAfterAddingProduct(productName);
    saveToLocalStorage(); // Save updated data
}

function updateUIAfterAddingProduct(productName) {
    document.getElementById('comingProduct').innerHTML += `<option>${productName}</option>`;
    document.getElementById('goingProduct').innerHTML += `<option>${productName}</option>`;
    document.getElementById('productSelect').innerHTML += `<option>${productName}</option>`;
    document.getElementById('stockTableBody').innerHTML += `<tr><td>${productName}</td><td id="${productName}StockTd">${productStockTotal[productName]}</td></tr>`;

    itemStockDivHtml = `<div hidden id="${productName}StockDiv" class="itemStockDiv">
        <h2 class="productNameH2">${productName}</h2>
        <h2 class="productStockH2" id="${productName}StockHeading">Stock: ${productStockTotal[productName]}</h2>
        <table>
            <thead>
                <th style="min-width:85px;">Date</th>
                <th style="min-width:152px;">Notes</th>
                <th>Coming</th>
                <th>Going</th>
                <th>Price</th>
                <th style="min-width:152px;">Purchasing Amount</th>
            </thead>
            <tbody id="${productName}StockTable" class="itemStockTable"></tbody>
        </table>
    </div>`;
    stockDiv.innerHTML += itemStockDivHtml;
}

function coming() {
    updateProduct = comingProduct.value;
    var isDecimal = comingQty.value != Math.trunc(comingQty.value);
    if (comingProduct.value === '' || comingQty.value === '' || comingPrice.value === '') {
        alert('Incomplete details'); return false; 
    }
    if (isDecimal || comingPrice.value < 1 || comingQty.value < 1) {
        alert('Incorrect details'); return false; 
    }

    index += 1;
    var productStockTable = document.getElementById(comingProduct.value + `StockTable`);
    var qty = comingQty.value;
    itemStockTableHtml = 
        `<tr>
            <td>${comingDate.value}</td>
            <td>${comingNote.value}</td>
            <td>${qty}</td>
            <td></td>
            <td>${comingPrice.value}</td>
            <td></td>
        </tr>`;
    productStockTable.innerHTML += itemStockTableHtml;

    productStockTotal[comingProduct.value] += parseInt(qty);
    productStockDetail[comingProduct.value].push({
        coming: qty,
        price: comingPrice.value,
        note: comingNote.value,
        date: comingDate.value,
    });
    productCurrentStockDetail[comingProduct.value].push({
        quantity: qty,
        price: comingPrice.value,
    });

    // Save updated data to local storage
    saveToLocalStorage(); // Save updated data
    document.getElementById('comingForm').reset();
    renderStockTotal();
    updateDate();
}

function going() {
    debugger;
    updateProduct = goingProduct.value;
    var isDecimal = goingQty.value != Math.trunc(goingQty.value);
    
    if (goingProduct.value === '' || goingQty.value === '') {
        alert('Incomplete details'); 
        return false;
    }
    if (isDecimal || goingQty.value < 1) {
        alert('Incorrect details'); 
        return false;
    }
    if (goingQty.value > productStockTotal[goingProduct.value]) {
        alert('Not enough stock'); 
        return false; // Ensure you have enough stock before processing the going transaction.
    }

    var productStockTable = document.getElementById(goingProduct.value + `StockTable`);
    var goingQuantity = parseInt(goingQty.value);

    while (goingQuantity > 0 && productCurrentStockDetail[goingProduct.value].length > 0) {
        // Access the latest stock entry
        let stockDetail = productCurrentStockDetail[goingProduct.value][0];

        // Determine the quantity to deduct
        let availableStock = stockDetail.quantity;
        let deductedQuantity = Math.min(availableStock, goingQuantity);

        // Update the HTML table
        itemStockTableHtml = `<tr>
            <td>${goingDate.value}</td>
            <td>${goingNote.value}</td>
            <td></td>
            <td>${deductedQuantity}</td>
            <td>${goingPrice.value}</td>
            <td>${stockDetail.price}</td>
        </tr>`;
        productStockTable.innerHTML += itemStockTableHtml;

        // Deduct the stock
        productStockTotal[goingProduct.value] -= deductedQuantity;
        stockDetail.quantity -= deductedQuantity;
        goingQuantity -= deductedQuantity;

        productStockDetail[goingProduct.value].push({
            going: deductedQuantity,
            price: goingPrice.value,
            note: goingNote.value,
            date: goingDate.value,
            purchasingAmount: stockDetail.price
        });
    
        // Update the UI for remaining quantity
        if (stockDetail.quantity === 0) {
            productCurrentStockDetail[goingProduct.value].splice(0, 1); // Remove this entry if quantity is zero
        }
    }

    // Save updated data to local storage
    saveToLocalStorage(); 
    document.getElementById('goingForm').reset();
    renderStockTotal();
    updateDate();
}

function renderStockTotal() {
    document.getElementById(updateProduct + `StockTd`).innerHTML = productStockTotal[updateProduct];
    document.getElementById(updateProduct + `StockHeading`).innerHTML = 'Stock: ' + productStockTotal[updateProduct];
}
function updateDate() {
    document.getElementById('goingDate').value = new Date().toLocaleDateString('en-CA');
    document.getElementById('comingDate').value = new Date().toLocaleDateString('en-CA');
}