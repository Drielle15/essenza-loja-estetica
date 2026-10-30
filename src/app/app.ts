
import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from './services/api';

@Component({
  selector: 'app-root',
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  protected readonly title = signal('Loja de Estética');

  paginaAtual = 'catalogo';

  itens: any[] = [];
  categorias: any[] = [];

  busca = '';
  categoriaSelecionada = '';
  tipoSelecionado = '';
  erro = '';

  carrinho: any[] = [];

  clienteId: number | null = null;

  mostrarCadastro = false;
  mensagemCadastro = '';
  erroCadastro = '';
  salvandoCadastro = false;

  pessoa = {
    nome: '',
    cpf: '',
    dataNascimento: '',
    sexo: '',
    email: '',
    telefone: '',
    ativoPessoa: 'S'
  };

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.api.listarItens().subscribe({
      next: dados => {
        console.log('Primeiro item recebido:', dados[0]);
        console.log('Quantidade recebida:', dados.length);

        this.itens = dados;
        this.busca = '';
        this.categoriaSelecionada = '';
        this.tipoSelecionado = '';
      },
      error: erro => console.log('Erro ao carregar itens:', erro)
    });
  }

  mostrarPagina(pagina: string): void {
    this.paginaAtual = pagina;

    if (pagina === 'cadastro') {
      this.mostrarCadastro = true;
      this.mensagemCadastro = '';
      this.erroCadastro = '';
    }
  }

  get itensFiltrados() {
    return this.itens.filter(item => {
      const nome = (item.item1 || '').toString().toLowerCase();
      const descricao = (item.descricaoItem || '').toString().toLowerCase();
      const buscaAtual = this.busca.toLowerCase().trim();

      return (
        (nome.includes(buscaAtual) ||
          descricao.includes(buscaAtual)) &&
        (this.categoriaSelecionada === '' ||
          Number(item.idcategoria) === Number(this.categoriaSelecionada)) &&
        (this.tipoSelecionado === '' ||
          item.tipoItem?.toString().trim().toUpperCase() === this.tipoSelecionado) &&
        (
          !item.ativoProdutoServico ||
          item.ativoProdutoServico.toString().trim().toUpperCase() === 'S'
        )
      );
    });
  }

  adicionarAoCarrinho(item: any): void {
    const encontrado = this.carrinho.find(
      linha => linha.item.iditem === item.iditem
    );

    if (encontrado) {
      encontrado.quantidade++;
    } else {
      this.carrinho.push({ item: item, quantidade: 1 });
    }
  }

  alterarQuantidade(iditem: number, valor: number): void {
    const linha = this.carrinho.find(
      linha => linha.item.iditem === iditem
    );

    if (linha) {
      linha.quantidade += valor;

      if (linha.quantidade <= 0) {
        this.removerDoCarrinho(iditem);
      }
    }
  }

  removerDoCarrinho(iditem: number): void {
    this.carrinho = this.carrinho.filter(
      linha => linha.item.iditem !== iditem
    );
  }

  get totalCarrinho(): number {
    return this.carrinho.reduce(
      (total, linha) => total + linha.item.preco * linha.quantidade, 0
    );
  }

  get quantidadeCarrinho(): number {
    return this.carrinho.reduce(
      (total, linha) => total + linha.quantidade, 0
    );
  }

  abrirCadastro(): void {
    this.mostrarCadastro = true;
    this.mensagemCadastro = '';
    this.erroCadastro = '';
  }

  fecharCadastro(): void {
    this.mostrarCadastro = false;
  }

  cadastrarCliente(): void {
    this.mensagemCadastro = '';
    this.erroCadastro = '';

    if (
      !this.pessoa.nome ||
      !this.pessoa.cpf ||
      !this.pessoa.dataNascimento ||
      !this.pessoa.sexo ||
      !this.pessoa.email ||
      !this.pessoa.telefone
    ) {
      this.erroCadastro = 'Preencha todos os campos.';
      return;
    }

    const dados = {
      nome: this.pessoa.nome,
      cpf: parseInt(this.pessoa.cpf.replace(/\D/g, ''), 10),
      dataNascimento: this.pessoa.dataNascimento,
      sexo: this.pessoa.sexo,
      email: this.pessoa.email,
      telefone: Number(this.pessoa.telefone.replace(/\D/g, '')),
      ativoPessoa: 'S'
    };

    this.salvandoCadastro = true;

    this.api.cadastrarPessoa(dados).subscribe({
      next: resposta => {
        console.log('Cliente cadastrado:', resposta);

        this.clienteId = Number(resposta.idpessoa);

        if (!this.clienteId) {
          this.erroCadastro = 'Não foi possível identificar o cliente cadastrado.';
          this.salvandoCadastro = false;
          return;
        }

        this.mensagemCadastro = 'Cliente cadastrado com sucesso!';
        this.erroCadastro = '';

        this.pessoa = {
          nome: '',
          cpf: '',
          dataNascimento: '',
          sexo: '',
          email: '',
          telefone: '',
          ativoPessoa: 'S'
        };

        this.salvandoCadastro = false;

        if (this.carrinho.length > 0) {
          this.mostrarCadastro = false;
          this.confirmarCompra();
        }
      },
      error: erro => {
        console.log(JSON.stringify(erro.error?.errors, null, 2));
        console.error('Erro ao cadastrar cliente:', erro);
        this.erroCadastro = 'Erro ao cadastrar cliente. Verifique os dados.';
        this.salvandoCadastro = false;
      }
    });
  }

  confirmarCompra(): void {
    if (this.carrinho.length === 0) {
      this.erro = 'Adicione pelo menos um item ao carrinho.';
      return;
    }

    if (!this.clienteId) {
      this.abrirCadastro();
      this.erro = 'Cadastre seus dados antes de finalizar a compra.';
      return;
    }

    const atendimento = {
      idPessoa: this.clienteId,
      dataAtendimento: new Date().toISOString().split('T')[0],
      statusAtendimento: 'P',
      itens: this.carrinho.map(linha => ({
        idItem: linha.item.iditem,
        idFuncionario: 2,
        quantidade: linha.quantidade,
        valorUnitario: linha.item.preco
      }))
    };

    console.log('Dados enviados para registrar compra:', atendimento);

    this.api.cadastrarAtendimento(atendimento).subscribe({
      next: () => {
        alert('Compra registrada com sucesso!');
        this.carrinho = [];
        this.erro = '';
        this.clienteId = null;
        this.mostrarCadastro = false;
      },
      error: erro => {
        console.error('Erro ao registrar compra:', erro);
        console.error('Detalhes da API:', erro.error);

        this.erro =
          'Não foi possível registrar a compra. Verifique os dados e o estoque.';
      }
    });
  }
}
