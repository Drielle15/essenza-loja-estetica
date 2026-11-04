
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class Api {
  private readonly url = 'https://localhost:7143/api';

  constructor(private http: HttpClient) {}

  // CATEGORIAS
  listarCategorias() {
    return this.http.get<any[]>(`${this.url}/Categorium`);
  }

  buscarCategoria(id: number) {
    return this.http.get<any>(`${this.url}/Categorium/${id}`);
  }

  cadastrarCategoria(categoria: any) {
    return this.http.post<any>(`${this.url}/Categorium`, categoria);
  }

  atualizarCategoria(id: number, categoria: any) {
    return this.http.put<any>(`${this.url}/Categorium/${id}`, categoria);
  }

  excluirCategoria(id: number) {
    return this.http.delete<any>(`${this.url}/Categorium/${id}`);
  }

  // PRODUTOS E SERVIÇOS
  listarItens() {
    return this.http.get<any[]>(`${this.url}/ItemServico`);
  }

  buscarItem(id: number) {
    return this.http.get<any>(`${this.url}/ItemServico/${id}`);
  }

  cadastrarItem(item: any) {
    return this.http.post<any>(`${this.url}/ItemServico`, item);
  }

  atualizarItem(id: number, item: any) {
    return this.http.put<any>(`${this.url}/ItemServico/${id}`, item);
  }

  excluirItem(id: number) {
    return this.http.delete<any>(`${this.url}/ItemServico/${id}`);
  }

  // PESSOAS E CLIENTES
  listarPessoas() {
    return this.http.get<any[]>(`${this.url}/Pessoa`);
  }

  buscarPessoa(id: number) {
    return this.http.get<any>(`${this.url}/Pessoa/${id}`);
  }

  cadastrarPessoa(pessoa: any) {
    return this.http.post<any>(`${this.url}/Pessoa`, pessoa);
  }

  atualizarPessoa(id: number, pessoa: any) {
    return this.http.put<any>(`${this.url}/Pessoa/${id}`, pessoa);
  }

  excluirPessoa(id: number) {
    return this.http.delete<any>(`${this.url}/Pessoa/${id}`);
  }

  // FUNCIONÁRIOS
  listarFuncionarios() {
    return this.http.get<any[]>(`${this.url}/PessoaFuncionarioEndereco`);
  }

  cadastrarFuncionario(funcionario: any) {
    return this.http.post<any>(`${this.url}/PessoaFuncionarioEndereco`, funcionario);
  }

  buscarFuncionario(id: number) {
    return this.http.get<any>(`${this.url}/PessoaFuncionarioEndereco/${id}`);
  }

  atualizarFuncionario(id: number, funcionario: any) {
    return this.http.put<any>(`${this.url}/PessoaFuncionarioEndereco/${id}`, funcionario);
  }

  excluirFuncionario(id: number) {
    return this.http.delete<any>(`${this.url}/PessoaFuncionarioEndereco/${id}`);
  }

  // ATENDIMENTOS
  listarAtendimentos() {
    return this.http.get<any[]>(`${this.url}/Atendimento`);
  }

  buscarAtendimento(id: number) {
    return this.http.get<any>(`${this.url}/Atendimento/${id}`);
  }

  cadastrarAtendimento(atendimento: any) {
    return this.http.post<any>(`${this.url}/Atendimento`, atendimento);
  }

  atualizarAtendimento(id: number, atendimento: any) {
    return this.http.put<any>(`${this.url}/Atendimento/${id}`, atendimento);
  }

  excluirAtendimento(id: number) {
    return this.http.delete<any>(`${this.url}/Atendimento/${id}`);
  }

  // ESTOQUE
  listarEstoque() {
    return this.http.get<any[]>(`${this.url}/Estoque`);
  }

  buscarEstoque(id: number) {
    return this.http.get<any>(`${this.url}/Estoque/${id}`);
  }

  atualizarEstoque(id: number, estoque: any) {
    return this.http.put<any>(`${this.url}/Estoque/${id}`, estoque);
  }

  // ENTRADA DE PRODUTOS
  listarEntradas() {
    return this.http.get<any[]>(`${this.url}/EntradaProduto`);
  }

  buscarEntrada(id: number) {
    return this.http.get<any>(`${this.url}/EntradaProduto/${id}`);
  }

  cadastrarEntrada(entrada: any) {
    return this.http.post<any>(`${this.url}/EntradaProduto`, entrada);
  }

  atualizarEntrada(id: number, entrada: any) {
    return this.http.put<any>(`${this.url}/EntradaProduto/${id}`, entrada);
  }

  excluirEntrada(id: number) {
    return this.http.delete<any>(`${this.url}/EntradaProduto/${id}`);
  }

  // PRODUTO
  listarProdutos() {
    return this.http.get<any[]>(`${this.url}/ProdutoItem`);
  }

  buscarProduto(id: number) {
    return this.http.get<any>(`${this.url}/ProdutoItem/${id}`);
  }

  cadastrarProduto(produto: any) {
    return this.http.post<any>(`${this.url}/ProdutoItem`, produto);
  }

  atualizarProduto(id: number, produto: any) {
    return this.http.put<any>(`${this.url}/ProdutoItem/${id}`, produto);
  }

  excluirProduto(id: number) {
    return this.http.delete<any>(`${this.url}/ProdutoItem/${id}`);
  }

  // ENDEREÇOS
  listarEnderecos() {
    return this.http.get<any[]>(`${this.url}/Endereco`);
  }

  cadastrarEndereco(endereco: any) {
    return this.http.post<any>(`${this.url}/Endereco`, endereco);
  }

  // ENDEREÇOS DE PESSOAS
  listarPessoasEnderecos() {
    return this.http.get<any[]>(`${this.url}/PessoaEndereco`);
  }
}
