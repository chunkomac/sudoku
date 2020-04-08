const fs = require("fs")
const _ = require("lodash")

class Filled extends Error {
  constructor(message, row, column ,newValue, cause) {
    super(message)
    this.row = row
    this.newValue = newValue
    this.column = column
    //console.log("Filled Row ", row, " Column ", column, " ------> ", newValue, " (", message, ")")
  }
}

class Sudoku {
	constructor(valueString) {
		this.values = this.stringTo2D(valueString)
		this.inverseMap = this.createInverseMap()
		this.pCO = []
	}

	createInverseMap() {
		const result = {}
		for (var digit = 1; digit < bigDim + 1; digit++) {
			result[digit] = []
		}
		for (var i = 0; i < bigDim; i++ ) {
			for (var j = 0; j < bigDim; j++) {
				if (this.values[i][j] === 0) continue;
				result[this.values[i][j]].push({ row: i, column: j})
			}
		}

		return result
	}

	stringTo2D(valueString) {
		var k = 0
		const values = []
		for (var i = 0; i < bigDim; i++) {
			const nextRow = []
			for (var j = 0; j < bigDim; j++) {
				nextRow.push(parseInt(valueString[k]))
				k++
			}
			values.push(nextRow)
		}

		return values
	}

	convert2DToString(values) {
		const newValues = []
		for (var i = 0; i < bigDim; i++) {
			newValues.push(values[i].join(""))
		}

		const result = newValues.join("")
		return result
	}

	areValid9(values) {
		const found = {}
		for (var i = 0; i < values.length; i++) {
			if (values[i] == 0) continue;
			if (values[i] in found) return false;
			found[values[i]] = true
		}

		return true
	}

	getRow(rowNum) {
		return this.values[rowNum]
	}

	getColumn(columnNum) {
		const column = []
		for (var j = 0; j < this.values.length; j++) {
			column.push(this.values[j][columnNum])
		}

		return column
	}

	getCube(cubeRow, cubeColumn) {
		//console.log("getCube:" ,cubeRow, cubeColumn)
		//console.log("getCube:", values[cubeRow])
		const dim = smallDim
		const cube = []
		const startRow = cubeRow * dim
		const startColumn = cubeColumn * dim
		for (var i = startRow; i < startRow + dim; i++) {
			for (var j = startColumn; j < startColumn + dim; j++) {
				//console.log("getCubeInternal: ", i, j)
				cube.push(this.values[i][j])
			}
		}

		return cube
	}

	getCubeFromCell(cellRow, cellColumn) {
		//console.log("getCubeFromCell:" ,cellRow, cellColumn)
		const cubeRow = parseInt(cellRow / smallDim)
		const cubeColumn = parseInt(cellColumn / smallDim)
		return this.getCube(cubeRow, cubeColumn)
	}


	/*
	function isValid(values) {
		return isValidRows(values) && isValidColumns(values) && isValidCubes(values)
	}*/

	areValidNumArrays(arrayOfNumArrays) {
		for (var i = 0; i < arrayOfNumArrays.length; i++) {
			if (!isValid(arrayOfNumArrays[i])) {
				return false
			}
		}
		return true
	}

	possibleCellOccupants(rowNum, columnNum) {
		if (this.values[rowNum][columnNum] !== 0) {
			// console.log("Returning value instead for ", rowNum, columnNum, " -----> ", values[rowNum][columnNum])
			//console.log("Possible Cell Occupants ALREADY   ", rowNum, columnNum)
			return [this.values[rowNum][columnNum]]
		}
		const allValues = (this.pCO[rowNum][columnNum] === undefined) ? _.range(1, bigDim + 1) : this.pCO[rowNum][columnNum]
		const row = this.getRow(rowNum)
		const column = this.getColumn(columnNum)
		const cube = this.getCubeFromCell(rowNum, columnNum)

		// const othersRow = getOthersRow(rowNum)
		// const othersColumn = getOthersColumn(columnNum)
		// console.log("allValues: ", allValues)
		// console.log("row: ", row)
		// console.log("column: ", column)
		// console.log("cube: ", cube)
		const result = _.difference(allValues, row, column, cube)
		// console.log("rowNum: " , rowNum, " columnNum: ", columnNum, " result: ", result)
		if (result.length === 0) {
			this.prettyPrint()
			throw new Error("Bad Calculation")
		}

		if (result.length === 1) {
			throw new Filled("PossibleCellOccupants", rowNum, columnNum, result[0])
		}

		//console.log("Possible Cell Occupants COMPLETED ", rowNum, columnNum)
		return result
	}

	computeAllPossibleCellOccupants() {
		this.pCO = []
		for (var i = 0; i < bigDim; i++) {
			this.pCO.push([])
			for (var j = 0; j < bigDim; j++) {
				this.pCO[i].push(this.possibleCellOccupants(i , j))
			}
		}
	}

	createInitialCellOccupantsView() {
		const result = []
		for (var i = 0; i < bigDim; i++) {
			const row = []
			for (var j = 0; j < bigDim; j++) {
				row.push(this.possibleCellOccupants(i , j))
			}
			result.push(row)
		}

		return result
	}

	checkDigitInOneCube(digit, cubeRow, cubeColumn) {
		let foundX = -1
		let foundY = -1
		let found = 0
		for (var i = cubeRow * smallDim; i < (cubeRow + 1) * smallDim; i++ ) {
			for (var j = cubeColumn * smallDim; j < (cubeColumn + 1) * smallDim; j++) {
				if (this.pCO[i][j].length > 1 && _.includes(this.pCO[i][j], digit)) {
					found++
					foundX = i
					foundY = j
				}
			}
		}

		if (found == 1) {
		/*	for (var i = cubeRow * smallDim; i < (cubeRow + 1) * smallDim; i++ ) {
				for (var j = cubeColumn * smallDim; j < (cubeColumn + 1) * smallDim; j++) {
					console.log(i, j, this.pCO[i][j], digit, _.includes(this.pCO[i][j], digit))
				}
			}
			this.prettyPrintPCO()*/
			throw new Filled("CellDigitTraversal", foundX, foundY, digit, "CellDigitTraversal")
		}
	}

	checkDigitInOneColumn(digit, column) {
		let foundX = -1
		let found = 0
		for (var i = 0; i < bigDim; i++ ) {
			if (this.pCO[i][column].length > 1 && _.includes(this.pCO[i][column], digit)) {
				found++
				foundX = i
			}
		}

		if (found == 1) {
		/*	for (var i = cubeRow * smallDim; i < (cubeRow + 1) * smallDim; i++ ) {
				for (var j = cubeColumn * smallDim; j < (cubeColumn + 1) * smallDim; j++) {
					console.log(i, j, this.pCO[i][j], digit, _.includes(this.pCO[i][j], digit))
				}
			}
			this.prettyPrintPCO()*/
			throw new Filled("CellColumnTraversal", foundX, column, digit, "CellColumnTraversal")
		}	
	}


	checkDigitInOneRow(digit, row) {
		let foundY = -1
		let found = 0
		for (var i = 0; i < bigDim; i++ ) {
			if (this.pCO[row][i].length > 1 && _.includes(this.pCO[row][i], digit)) {
				found++
				foundY = i
			}
		}

		if (found == 1) {
		/*	for (var i = cubeRow * smallDim; i < (cubeRow + 1) * smallDim; i++ ) {
				for (var j = cubeColumn * smallDim; j < (cubeColumn + 1) * smallDim; j++) {
					console.log(i, j, this.pCO[i][j], digit, _.includes(this.pCO[i][j], digit))
				}
			}
			this.prettyPrintPCO()*/
			throw new Filled("CellRowTraversal", row, foundY, digit, "CellRowTraversal")
		}	
	}


	checkDigitInEachCube(digit) {
		for (var i = 0; i < smallDim; i++) {
			for (var j = 0; j < smallDim; j++) {
				this.checkDigitInOneCube(digit, i, j)
				//console.log("Digitwise check done for " + digit + " in " + i + " " + j)
			}
		}
	}

	checkDigitInEachColumn(digit) {
		for (var i = 0; i < bigDim; i++) {
			this.checkDigitInOneColumn(digit, i)
		}
	}

	checkDigitInEachRow(digit) {
		for (var i = 0; i < bigDim; i++) {
			this.checkDigitInOneRow(digit, i)
		}
	}

	checkDigit(digit) {
		this.checkDigitInEachCube(digit)
		this.checkDigitInEachColumn(digit)
		this.checkDigitInEachRow(digit)
	}

	computeDigitWise() {
		for (var i = 1; i < bigDim + 1; i++) {
			this.checkDigit(i)
		}
	}

	startCrunching() {
		try {
			this.computeAllPossibleCellOccupants()
			console.log("-----------------------------------------------")
			this.computeDigitWise()
		} catch (err) {
			if (err instanceof Filled) {
				this.values[err.row][err.column] = err.newValue
				//this.prettyPrint(err.row, err.column)
				this.inverseMap[err.newValue].push({row: err.row, column: err.column})
				this.startCrunching()
				return
			}

			throw err
		}
	}

	isFinished() {
		for (var i = 0; i < bigDim; i++) {
			for (var j = 0; j < bigDim; j++) {
				if (this.values[i][j] === 0) {
					return false
				}
			}
		}

		return true
	}

	finalTwoDim() {
		return this.values
	}

	final2DString() {
		return this.convert2DToString(this.values)
	}

	finalInverseMap() {
		return this.inverseMap
	}

	prettyPrint(rowNumToHighlight, columnNumToHighlight) {
		for (var i = 0; i < bigDim; i++) {
			let row = ""
			for (var j = 0; j < bigDim; j++) {
				if (this.values[i][j] === 0) {
					row += "   "
				} else {
					if (i === rowNumToHighlight && j === columnNumToHighlight) {
						row += "(" + this.values[i][j] + ")"
					} else {
						row += " " + this.values[i][j] + " "
					}
				}

				if ((j + 1) % smallDim === 0 && j !== bigDim - 1) {
					row += " | "
				}
			}

			console.log(row)
			if (((i + 1) % smallDim === 0)) {
				let delim = ""
				for (var k = 0; k < 3 * (bigDim + smallDim - 1) ; k++) {
					delim += "-"
				}
				console.log(delim)
			}
		}
	}

	prettyPrintPCO(rowNumToHighlight, columnNumToHighlight) {
		for (var i = 0; i < bigDim; i++) {
			for (var j = 0; j < bigDim; j++) {
				console.log(i, " ", j, " ", this.pCO[i][j])	
			}
		}
	}
}


const smallDim = 3
const bigDim = smallDim * smallDim
//const data = JSON.parse(fs.readFileSync("puzzles")).dataView.rows

const data = JSON.parse(fs.readFileSync("millionpuzzles.json"))

for (var i = 970805; i < data.length; i++) {
	const first = data[i]
	//const puzzleString = first.text[0]
	const puzzleString = first.quizzes
	//const sudoku = new Sudoku(puzzleString)
	//const sudoku = new Sudoku("718526934060079502529300607135697428086100795097050361940205876850760249672984153")
	//const sudoku = new Sudoku("090000280050082460280000005672894513830020000540060802415730020928050000060200050")
	const sudoku = new Sudoku("090000000000000460200000005070804010030020000500060800010730020908050000000200000")
	//console.log(puzzleString)
	//console.log(twoDim)
	//console.log(areValid9([0, 0, 0, 1, 2, 3, 4, 0, 0, 0]))
	//console.log(areValid9([0, 0, 0, 1, 2, 3, 4, 0, 0, 1]))

	//console.log(getRow(twoDim, 2))
	//console.log(getColumn(twoDim, 0))
	//console.log(getCube(twoDim, 2, 2))

	// const cellOccupantsView = createInitialCellOccupantsView(twoDim)
	// console.log(cellOccupantsView)

	// console.log(possibleCellOccupants(twoDim, 0, 0))
	/*computeAllPossibleCellOccupants(twoDim)
	console.log("******************************************************")
	console.log(twoDim)
	computeAllPossibleCellOccupants(twoDim)
	console.log("******************************************************")
	console.log(twoDim)
	computeAllPossibleCellOccupants(twoDim)
	console.log("******************************************************")
	console.log(twoDim)
	computeAllPossibleCellOccupants(twoDim)
	console.log("******************************************************")
	console.log(twoDim)
	*/
	//console.log("******************************************************")
	//console.log(twoDim)
	//console.log("******************************************************")
	//console.log(twoDim)
	//console.log(possibleCellOccupants(twoDim, 4, 6))
	//console.log(possibleCellOccupants(twoDim, 4, 7))
	sudoku.prettyPrint()
	sudoku.startCrunching()
	if (sudoku.isFinished()) {
		console.log("====================FINISHED EXECUTION " + i + "=======================")	
		sudoku.prettyPrint()
	} else {
		console.log("$$$$$$$$$$$$$$$$$$$UNFINISHED EXECUTION" + i + "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")	
		sudoku.prettyPrint()
		//sudoku.prettyPrintPCO()
		console.log(sudoku.final2DString())
		//console.log(sudoku.finalInverseMap())
		throw new Error("Unfinished")
	}

}