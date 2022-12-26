import Student from 'models/Student';

/**
 * POCO class to contain informationo about a user login
 */
export default class UserLogin {
    id: string | null;
    name: string;
    uwNetId: string;
    studentId: string;
    loginReason: string;
    createdAt: string;

    /**
     * Instatites a new user login
     * @param name Student's full name
     * @param uwNetId Student's UW Net ID
     * @param studentId Student's ID number
     * @param loginReason Reason that the student is logging in
     */
    constructor(studentInfo: Student, loginReason: string, id: string | null = null, createdAt: string = (new Date()).toJSON()) {
        this.name = studentInfo.name;
        this.uwNetId = studentInfo.uwNetId;
        this.studentId = studentInfo.studentId;
        this.loginReason = loginReason;
        this.createdAt = createdAt;
        this.id = id;
    }
}