import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchKey',
  pure: true,
  standalone: true
})
export class SearchKeyPipe implements PipeTransform {

  transform(items: any[], searchText: string, searchType: string = 'all'): any[] {
    if (!items || !Array.isArray(items)) return [];
    if (!searchText) return items;
    const query = searchText.toLowerCase().trim();
    return items.filter(item => {
      if (!item) return false;
      const fullName = (item.fullName || item.fullname || item.name || '').toString().toLowerCase();
      const email = (item.email || '').toString().toLowerCase();
      const department = (item.department || '').toString().toLowerCase();
      const designation = (item.designation || '').toString().toLowerCase();
      const employeeId = (item.employeeId || item.id || item._id || '').toString().toLowerCase();
      const status = (item.status || '').toString().toLowerCase();

      switch (searchType) {
        case 'fullName':
          return (fullName.includes(query) || email.includes(query))
        case 'designation':
          return designation.includes(query)
        case 'department':
          return department.includes(query)
        case 'status':
          return status.includes(query)
        case 'employeeId':
          return employeeId.includes(query)
        default:
          return (
            fullName.includes(query) ||
            email.includes(query) ||
            department.includes(query) ||
            designation.includes(query) ||
            employeeId.includes(query) ||
            status.includes(query)
          );
      }
    });
  }

}

