export interface Employee {
  _id?: string;
  employeeId?: string;
  id?: string | number;
  fullName?: string;
  fullname?: string;
  name?: string;
  email: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate?: string | Date;
  status: 'active' | 'inactive';
}
