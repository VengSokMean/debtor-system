import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Debtor } from '../models/debtor';
@Injectable({providedIn:'root'}) export class DebtorService {
 private api='/.netlify/functions/debtors';
 constructor(private http:HttpClient){}
 list():Observable<Debtor[]>{return this.http.get<Debtor[]>(this.api)}
 create(d:Debtor){return this.http.post<Debtor>(this.api,d)}
 update(d:Debtor){return this.http.put<Debtor>(`${this.api}?id=${d._id}`,d)}
 remove(id:string){return this.http.delete(`${this.api}?id=${id}`)}
}
