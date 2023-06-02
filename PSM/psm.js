const csv = require("csv-parser");
const fs = require("fs");
const maxPrice = 600;
const priceChange = 50;

//CSVデータを読み込む
function loadCSV(filePath) {
  const csvData = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      csvData.push(data);
    })
    .on("end", () => {
      handleData(csvData);
    })
    .on("error", (error) => {
      console.error("ファイル読み込み時にエラー発生:", error);
    });
}

loadCSV("./PSMrawdata.csv");

//読み込まれたデータを取り扱う
function handleData(csvData) {
  let price = 50;
  let percentData = [];
  const len = csvData.length;

  while (price <= maxPrice) {
    percentData.push({
      price: price,
      高い: countOccurrences(csvData, price, "高い", true) / len,
      安い: countOccurrences(csvData, price, "安い", false) / len,
      高すぎる: countOccurrences(csvData, price, "高すぎる", true) / len,
      安すぎる: countOccurrences(csvData, price, "安すぎる", false) / len,
    });
    price += priceChange;
  }
  const saikou = handleLines(percentData, "高すぎる", "安い");
  const dakyou = handleLines(percentData, "高い", "安い");
  const risou = handleLines(percentData, "高すぎる", "安すぎる");
  const hosyou = handleLines(percentData, "高い", "安すぎる");

  //結果を表示
  console.log(
    `PSM分析結果:\n最高価格:${saikou}円\n妥協価格:${dakyou}円\n理想価格:${risou}円\n最低品質保証価格:${hosyou}円`
  );
}

function countOccurrences(array, price, category, isLess) {
  return array.reduce((count, elem) => {
    if (isLess === true) {
      return Number(elem[category]) <= price ? count + 1 : count;
    } else {
      return Number(elem[category]) >= price ? count + 1 : count;
    }
  }, 0);
}

//二つの直線それぞれの点の値を求める
function handleLines(array, category1, category2) {
  for (let i = 0; i < array.length - 1; i++) {
    const x1 = array[i].price;
    const y1 = array[i][category1];
    const x2 = array[i + 1].price;
    const y2 = array[i + 1][category1];
    const x3 = array[i].price;
    const y3 = array[i][category2];
    const x4 = array[i + 1].price;
    const y4 = array[i + 1][category2];

    const intersection = getIntersection(x1, y1, x2, y2, x3, y3, x4, y4);
    if (intersection) {
      return intersection;
    }
  }
  return null;
}

//交点を求める
function getIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  //分母が０の時はnullを返す
  const xDenominator = (y1 - y2) * (x3 - x4) - (x1 - x2) * (y3 - y4);
  const yDenominator = x1 - x2;
  if (xDenominator === 0 || yDenominator === 0) return null;
  const x =
    ((y3 - y1) * (x1 - x2) * (x3 - x4) +
      x1 * (y1 - y2) * (x3 - x4) -
      x3 * (y3 - y4) * (x1 - x2)) /
    xDenominator;
  const y =
    (x * (y1 - y2)) / yDenominator + y1 - (x1 * (y1 - y2)) / yDenominator;

  if (x1 <= x && x <= x2 && y1 <= y && y <= y2) {
    return Math.round(x);
  } else {
    return null;
  }
}
