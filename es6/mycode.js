global.DEBUG = false
let tableElement = document.getElementById("tbody");
let dataMapper = new Map();
let dataCheckforTimeout = new Map();
const url = "ws://localhost:8011/stomp"
const client = Stomp.client(url)
// client.debug = function (msg) {

//     if (global.DEBUG) {
//         console.info(msg)
//     }
// }

//function to change algorithm to do sorting on array of objects
function sorting(a, b) {

    if (a.lastChangeBid > b.lastChangeBid) {
        return 1;
    }
    else if (a.lastChangeBid < b.lastChangeBid) {
        return -1;
    }
    return 0;
}

function getNewObject(rowdata, midvalue) {

    let data = new Object()    // Spread operator was giving issue (  some loader in bable is missing ) , So used this, otherwise would have gone for {...Obj,mid:"value"}
    Object.keys(rowdata).forEach(key => {
        data[key] = rowdata[key];
    });
    data["mid"] = midvalue;
    return data;
}

//function to Add element in Map for displaying on Taable
function toAddinMap(rowdata) {

    let rowvalue;

    let midValue = (rowdata.bestAsk + rowdata.bestBid) / 2;
    !dataCheckforTimeout.has(rowdata.name) && dataCheckforTimeout.set(rowdata.name, 1);

    if (!dataMapper.has(rowdata.name)) {

        rowvalue = getNewObject(rowdata, [midValue]);
    }
    else {

        rowvalue = getNewObject(rowdata, [...dataMapper.get(rowdata.name).mid, midValue]);
    }

    dataMapper.set(rowdata.name, rowvalue);
    let rowCount = tableElement.rows.length;
    for (let x = rowCount - 1; x >= 0; x--) {
        tableElement.deleteRow(x);
    }
    const array = [...dataMapper.values()];
    array.sort(sorting);          // calling call back function for sorting algorithm
    return array;

}

//function for generating SparkElemnt
function getSparkElement(item, mid) {
    const exampleSparkline = document.getElementById(item);
    const sparkline = new Sparkline(exampleSparkline);
    sparkline.draw([...mid]);
    if (dataCheckforTimeout.has(item) && dataCheckforTimeout.get(item)) {    // checking if Timepout is already triggered for current currency for resetting the sparking array to empty 
        dataCheckforTimeout.set(item, 0);
        setTimeout(() => {
            dataMapper.get(item).mid = [];
            dataCheckforTimeout.set(item, 1);
        }, 30000);
    }

}
// Function to add row in table
function toAddRowiteminTable(rowdata) {


    let rowitem = tableElement.insertRow(-1);
    let cell1 = rowitem.insertCell(0);
    let cell2 = rowitem.insertCell(1);
    let cell3 = rowitem.insertCell(2);
    let cell4 = rowitem.insertCell(3);
    let cell5 = rowitem.insertCell(4);
    let cell6 = rowitem.insertCell(5);
    cell1.innerHTML = rowdata.name;
    cell2.innerHTML = rowdata.bestBid;
    cell3.innerHTML = rowdata.bestAsk;
    cell4.innerHTML = rowdata.lastChangeAsk;
    cell5.innerHTML = rowdata.lastChangeBid;
    cell6.innerHTML = '<span id="' + rowdata.name + '"></span>';


    getSparkElement(rowdata.name, rowdata.mid);


}
function addRows(sortedItems) {
    for (const v of sortedItems) {
        toAddRowiteminTable(v)
    }
}

function connectCallback() {

    //Subscribing to Data Provider
    client.subscribe("/fx/prices", function (data) {

        //Sorting Data and returning sorted array based on  "LastChangeBid" "Asc" order
        let sortedItems = toAddinMap(JSON.parse(data.body))

        //Adding row to Table
        addRows(sortedItems)


    });

}

client.connect({}, connectCallback, function (error) {
    alert(error.headers.message)
})



