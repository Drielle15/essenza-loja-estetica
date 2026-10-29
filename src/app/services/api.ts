import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class Api {
  private readonly url = 'https://localhost:7143/api';

  constructor(private http: HttpClient) {}

  listarCategorias() {
    return this.http.get<any[]>(`${this.url}/Categorium`);
  }

  listarItens() {
    return this.http.get<any[]>(`${this.url}/ItemServico`);
  }

  listarPessoas() {
    return this.http.get<any[]>(`${this.url}/Pessoa`);
  }

  cadastrarPessoa(pessoa: any) {
    return this.http.post<any>(`${this.url}/Pessoa`, pessoa);
  }
  

  cadastrarAtendimento(atendimento: any) {
    return this.http.post<any>(`${this.url}/Atendimento`,atendimento);
  }



}
