import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { GetApi } from '../core/services/get-api';
import { SearchKeyPipe } from '../pipes/search-key-pipe';
import { HighlightRow } from '../directives/highlight-row';
import { AuthService } from '../core/services/auth.service';
import { AuthStateService } from '../core/services/auth-state.service';
import { UserService } from '../core/services/user.service';
import { Employee } from '../core/models/employee.model';
import { SocketService } from '../core/services/socket.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchKeyPipe, HighlightRow, RouterLink, RouterOutlet],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  constructor(
    private route: Router,
    private getAPI: GetApi,
    private authService: AuthService,
    private authState: AuthStateService,
    private userService: UserService,
    private socketService: SocketService
  ) { }

  searchQuery = '';
  searchType:
    | 'all'
    | 'fullName'
    | 'designation'
    | 'department'
    | 'status'
    | 'employeeId'
    = 'all'
  allEmployees: Employee[] = [];
  employees: Employee[] = [];
  isEditMode = false;
  showTable = false;
  showForm = false;

  page = 1;
  limit = 20;
  totalPages = 1;
  totalEmployees = 0;

  employee: Partial<Employee> = this.resetForm();

  resetForm(): Partial<Employee> {
    return {
      fullName: '',
      email: '',
      department: '',
      designation: '',
      salary: 0,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };
  }

  loadEmployee(page: number = 1) {
    this.page = page;
    this.getAPI.getEmployee(this.page, this.limit).subscribe({
      next: (res: any) => {
        const data = res?.data || {};
        const empList = data.employees || (Array.isArray(data) ? data : []);
        this.employees = Array.isArray(empList) ? empList : [];
        this.allEmployees = [...this.employees];
        this.totalEmployees = data.total ?? this.employees.length;
        this.totalPages = data.totalPages ?? (Math.ceil(this.totalEmployees / this.limit) || 1);
        this.showTable = true;
      },
      error: (err) => {
        console.error('Error fetching employees', err);
      }
    });
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.loadEmployee(this.page + 1);
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.loadEmployee(this.page - 1);
    }
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages) {
      this.loadEmployee(p);
    }
  }

  addNewEmployee() {
    this.employee = this.resetForm();
    this.showForm = true;
    this.isEditMode = false;
  }

  editEmployee(emp: any) {
    this.isEditMode = true;
    let formattedDate = emp.joiningDate;
    if (formattedDate) {
      const d = new Date(formattedDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split('T')[0];
      }
    }
    this.employee = {
      ...emp,
      fullName: emp.fullName || emp.fullname || emp.name || '',
      joiningDate: formattedDate || ''
    };
    this.showForm = true;
  }

  deleteEmployee(id: string | number | undefined) {
    if (!id) return;
    this.getAPI.deleteEmployee(id).subscribe({
      next: () => {
        this.employees = this.employees.filter(
          (emp) => emp.employeeId !== id && emp._id !== id && emp.id !== id
        );
      },
      error: (err) => {
        console.error('Error deleting employee', err);
      }
    });
  }

  saveEmployee() {
    const payload = {
      fullName: this.employee.fullName || this.employee.fullname || this.employee.name || '',
      email: this.employee.email || '',
      department: this.employee.department || '',
      designation: this.employee.designation || '',
      salary: Number(this.employee.salary) || 0,
      joiningDate: this.employee.joiningDate,
      status: this.employee.status || 'active'
    };

    if (this.isEditMode) {
      const empId = this.employee._id || this.employee.employeeId || this.employee.id;
      if (!empId) return;
      this.getAPI.updateEmployee(empId, payload).subscribe({
        next: (res: any) => {
          const updated = res?.data || res;
          const index = this.employees.findIndex(
            (x) => x._id === empId || x.employeeId === empId || x.id === empId
          );
          if (index !== -1) {
            this.employees[index] = { ...this.employees[index], ...updated, ...payload };
          } else {
            this.loadEmployee();
          }
          this.showForm = false;
        },
        error: (err) => {
          console.error('Error updating employee', err);
        }
      });
    } else {
      this.getAPI.addEmployee(payload).subscribe({
        next: (res: any) => {
          const created = res?.data || res;
          this.employees.unshift(created);
          this.showForm = false;
        },
        error: (err) => {
          console.error('Error creating employee', err);
        }
      });
    }
  }

  logOut(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.socketService.disconnect()
        this.authState.setUser(null);
        this.userService.currentUser.set(null);
        this.route.navigate(['/login']);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
}

