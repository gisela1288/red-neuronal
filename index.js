const util = require('util')

const log = (obj) => console.log(util.inspect(obj, {showHidden: false, depth: null}))

const modifyNumberRadomly = (number, error) => number + randomNumberRange(error / 10);

const randomNumberRange = (range) => (Math.random() * range ) - (range / 2);

const initialWeightRange = 0.2;

const modifyWebRandomly = (neuralWeb, error) => {
    if (neuralWeb.previus == null) {
        return {
            nodes: neuralWeb.nodes.map((node) => ({
                weights: [],
                multiplier: modifyNumberRadomly(node.multiplier, error)
            }))
        }

    } else {
        const previusWeb = modifyWebRandomly(neuralWeb.previus, error)
        return {
            previus: previusWeb,
            nodes: neuralWeb.nodes.map((node) => ({
                weights: node.weights.map(weight => modifyNumberRadomly(weight, error)),
                multiplier: modifyNumberRadomly(node.multiplier, error)
            }))
        }
    }
}

const createNextGen = (neuralWeb, error, qty) => {
    return Array(qty).fill(0).map(() => modifyWebRandomly(neuralWeb, error))
}

const createNodes = (qty, previusLayer) => {
    return {
        previus: previusLayer,
        nodes: Array(qty)
                .fill(0) 
                .map(() => ({
                    weights: previusLayer != null ? 
                        Array(previusLayer.nodes.length).fill(0).map(() => randomNumberRange(initialWeightRange)) : [],
                    multiplier: randomNumberRange(initialWeightRange)
                }))
    }
}

let cache = {}

const compute = (neuralWeb, values, inited) => { 
    if (!inited) {
        cache = {}
    }

    if (neuralWeb.previus == null) {
        return values.map((val, index) => val * neuralWeb.nodes[index].multiplier);

    } else {
        const previusValues = compute(neuralWeb.previus, values, true)
        return neuralWeb.nodes.map((node) => {
            if (node in cache) {
                return cache[node]
            }

            const suma = previusValues
            .map((val, index) => val * node.weights[index])
            .reduce((acc, act) => acc + act, 0)

            cache[node] = suma * node.multiplier;
            return cache[node];
        });
    }
}

const sizeOfNumbersToEval = 100
const valuesToEval = Array(sizeOfNumbersToEval).fill(0).map(() => [ randomNumberRange(15), randomNumberRange(15) ]);

const neuralCandidates = 100
const suma = ([a, b]) => {
    return a + b
}

log(valuesToEval)

const initalNeuronsWebs = Array(neuralCandidates)
    .fill(0)
    .map(() => 
        createNodes(1, createNodes(10, createNodes(10, createNodes(10, createNodes(10, createNodes(2))))))
    )
    
const eval = (neuronsWebs, testValues, errorFun) =>
    neuronsWebs.map(neuralWeb => ({
        neural: neuralWeb,
        tests: testValues.map(value => ({
            value, 
            result: compute(neuralWeb, value, false)[0] 
        }))
    }))
    .map(result => ({
        neural: result.neural, 
        tests: result.tests.map((test) => ({
            ...test,
            diff: errorFun(test.result, test.value)
        }))
    }))
    .map(result => ({
        ...result,
        errorDiff: result.tests.reduce((acc, act) => acc + act.diff, 0) / result.tests.length
    }))
    .sort((a, b) => a.errorDiff - b.errorDiff )

const errorDiffFun =  (result, input) => Math.abs(result- suma(input))

let lastResults = eval(initalNeuronsWebs, valuesToEval, errorDiffFun)

log(lastResults.slice(0, 10).map(result => result.errorDiff))

let nextGen;

let newResults;

Array(25).fill(0).forEach((val, index) => {

    nextGen = createNextGen(lastResults[0].neural, lastResults[0].errorDiff, 1000);
    newResults = eval(nextGen, valuesToEval, errorDiffFun)

    log(newResults.slice(0, 10).map(result => result.errorDiff))
    if ( newResults[0].errorDiff < lastResults[0].errorDiff) {
        log("BAJO")
        log(compute(nextGen[0], [ 30, 30 ]), false)
    } else {
        log("SUBIO")
    }

    lastResults = newResults[0].errorDiff < lastResults[0].errorDiff ? newResults : lastResults;
})

log(nextGen[0])
log(compute(nextGen[0], [ 5, 10 ], false) )


module.export = {
    compute,
    nextGen
}