/**
 * POCO class to contain information about a student
 */
export default class Student {
    name: string;
    studentId: string;
    uwNetId: string;

    /**
     * Instantiate a new Student
     * @param name Student's full name
     * @param studentId Student's ID
     * @param uwNetId Student's UW Net ID
     */
    constructor(name: string, studentId: string, uwNetId: string) {
        if (name == null || name.length == 0) {
            throw Error('Name cannot be null or of length 0')
        }

        if (studentId == null || studentId.length == 0) {
            throw Error('Student ID cannot be null or of length 0')
        }

        if (uwNetId == null || uwNetId.length == 0) {
            throw Error('UW Net ID cannot be null or of length 0')
        }

        this.name = name;
        this.studentId = studentId;
        this.uwNetId = uwNetId;
    }
}
