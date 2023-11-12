function averageThreeNumbers(a, b, c) {
    let sum = a + b + c;
    return sum/3;
}

function createSentence(num, noun) {
    return `On average, a Berkeley student has ${num} ${noun}.`
}

function getRandomNum(max) {
    return Math.random() * max;
}

let x = getRandomNum(20);
let y = getRandomNum(10);
let z = getRandomNum(13);

let avg = averageThreeNumbers(x, y, z);

let animal = 'platypuses'

if (avg == 1) {
    animal = 'platypus'
}

let sentence = createSentence(avg, animal);

console.log(sentence);