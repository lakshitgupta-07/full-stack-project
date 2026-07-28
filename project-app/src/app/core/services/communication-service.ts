import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommunicationService {
  private dataSource = new BehaviorSubject<any[]>([]);

  users$ = this.dataSource.asObservable();

  private selectedUserSource = new BehaviorSubject<any>(null);

  selectedUser$ = this.selectedUserSource.asObservable();

  addUser(user: any) {
    const currentData = this.dataSource.value;

    this.dataSource.next([...currentData, user]);
  }

  updateUser(index: number, user: any) {
    const currentData = [...this.dataSource.value];

    currentData[index] = user;

    this.dataSource.next(currentData);
  }

  deleteUser(index: number) {
    const currentData = [...this.dataSource.value];

    currentData.splice(index, 1);

    this.dataSource.next(currentData);
  }

  selectUser(index: number) {
    const user = this.dataSource.value[index];

    this.selectedUserSource.next({
      index,
      user,
    });
  }
}
