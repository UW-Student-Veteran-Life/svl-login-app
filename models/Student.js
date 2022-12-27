/**
 * A POCO class to contain information about a student
 * 
 * @property {string} name The full name of the student
 * @property {string} number Student number
 * @property {string} uwNetId The UW Net ID belonging to a student
 */
class Student {
    name;
    number;
    uwNetId;

    constructor(studentName, studentNumber, uwNetId) {
        this.name = studentName;
        this.number = studentNumber;
        this.uwNetId = uwNetId;
    }
}

module.exports = Student;
