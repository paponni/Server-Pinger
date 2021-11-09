import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NotifierService } from 'angular-notifier';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { Server } from './interface/server';
import { ServerService } from './service/server.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{

  appState$:Observable<AppState<CustomResponse>>;
  readonly DataState = DataState;
  readonly Status =Status ;
   private filterSubject  = new BehaviorSubject<string>('');
   private dataSubject  = new BehaviorSubject<CustomResponse>(null);
   private isLoading  = new BehaviorSubject<Boolean>(false);
  //  private readonly notifier: NotifierService;



   filterStatus$ = this.filterSubject.asObservable();
   isLoading$ = this.isLoading.asObservable();



constructor(private serverService : ServerService,private notifier: NotifierService){
  
}

  ngOnInit(): void{
    this.appState$ = this.serverService.server$
    .pipe(
        map(response =>{
          this.dataSubject.next(response);
          this.notifier.notify('success', 'You are awesome! I mean it!');

          return {dataState : DataState.LOADED_STATE , appData : {...response, 
            data : { servers : response.data.servers.reverse()}} }
        }),
        startWith({dataState : DataState.LOADING_STATE}),
        catchError((error:string)=>{
          return of({dataState : DataState.ERROR_STATE,error :error})
        })
    );

  }

  pingServer(ipAdress:string): void{
    this.filterSubject.next(ipAdress);
    this.appState$ = this.serverService.ping$(ipAdress)
    .pipe(
        map(response => {
          this.dataSubject.value.data.servers[
            this.dataSubject.value.data.servers.findIndex(server =>
              server.id === response.data.server.id)
          ] = response.data.server; 
          this.filterSubject.next('');

          return {dataState : DataState.LOADED_STATE , appData : this.dataSubject.value }
        }),
        startWith({dataState : DataState.LOADED_STATE,appData : this.dataSubject.value}),
        catchError((error:string)=>{
          return of({dataState : DataState.ERROR_STATE,error :error})
        })
    );

  }

  filterServers(status:Status): void{
    this.appState$ = this.serverService.filter$(status,this.dataSubject.value)
    .pipe(
        map(response => {
          
          return {dataState : DataState.LOADED_STATE , appData : response }
        }),
        startWith({dataState : DataState.LOADED_STATE,appData : this.dataSubject.value}),
        catchError((error:string)=>{
          return of({dataState : DataState.ERROR_STATE,error :error})
        })
    );

  }


  saveServer(serverForm:NgForm): void{
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(serverForm.value)
    .pipe(
        map(response => {
         this.dataSubject.next(
           {...response,data : {servers : [response.data.server , ...this.dataSubject.value.data.servers]}}
         );
         this.isLoading.next(false);
         serverForm.resetForm({ status :Status.SERVER_DOWN});
          document.getElementById("closeModal").click();
          return {dataState : DataState.LOADED_STATE , appData : this.dataSubject.value }
        }),
        startWith({dataState : DataState.LOADED_STATE,appData : this.dataSubject.value}),
        catchError((error:string)=>{
          return of({dataState : DataState.ERROR_STATE,error :error})
        })
    );

  }

  deleteServer(server:Server): void{
    this.appState$ = this.serverService.delete$(server.id)
    .pipe(
        map(response => {
         this.dataSubject.next(
           {...response,data :
             {servers : this.dataSubject.value.data.servers.filter(s => s.id !== server.id)}

           }
         ) 

          return {dataState : DataState.LOADED_STATE , appData : this.dataSubject.value }
        }),
        startWith({dataState : DataState.LOADED_STATE,appData : this.dataSubject.value}),
        catchError((error:string)=>{
          return of({dataState : DataState.ERROR_STATE,error :error})
        })
    );

  }
  printReport() : void {
    window.print();
    // let dataType = 'application/vnd.ms-excel.sheet.macroEnabled.12';
    // let tableSelect = document.getElementById('servers');
    // let tableHtml = tableSelect.outerHTML.replace(/ /g,'%20');
    // let downloadLink = document.createElement('a');
    // document.body.appendChild(downloadLink);
    // downloadLink.href = 'data:'+ dataType + ',' + tableHtml;
    // downloadLink.download='server-report.xls';
    // downloadLink.click();
    // document.body.removeChild(downloadLink);
  }


}
