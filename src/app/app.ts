
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

  // Guarda o título da loja, que pode ser utilizado na tela.
  protected readonly title = signal('Loja de Estética');

  // Controla qual página está sendo exibida, como catálogo ou cadastro.
  paginaAtual = 'catalogo';

  // Armazena os produtos, serviços e categorias recebidos da API.
  itens: any[] = [];
  categorias: any[] = [];

  // Variáveis utilizadas para pesquisar e filtrar os produtos e serviços.
  busca = '';
  categoriaSelecionada = '';
  tipoSelecionado = '';
  erro = '';

  // Armazena os produtos e serviços que o cliente escolheu comprar.
  carrinho: any[] = [];

  // Guarda o código do cliente depois que ele realiza o cadastro.
  clienteId: number | null = null;

  // Controlam a abertura do cadastro e as mensagens exibidas ao usuário.
  mostrarCadastro = false;
  mensagemCadastro = '';
  erroCadastro = '';
  salvandoCadastro = false;

  // Armazena as informações que o cliente preenche no formulário de cadastro.
  pessoa = {
    nome: '',
    cpf: '',
    dataNascimento: '',
    sexo: '',
    email: '',
    telefone: '',
    ativoPessoa: 'S'
  };

  // Controla os dados exibidos na área administrativa.
  pessoas: any[] = [];
  funcionarios: any[] = [];
  atendimentos: any[] = [];
  estoques: any[] = [];
  entradas: any[] = [];

  // Controla a opção selecionada na administração.
  paginaAdmin = 'inicio';
  erroAdmin = '';

  // Construtor responsável por conectar o componente ao serviço que acessa a API.
  constructor(private api: Api) {}

  // Essa função é executada quando a aplicação é iniciada.
  // Ela busca os produtos, serviços e categorias cadastrados no banco de dados.
  ngOnInit(): void {

    // Busca os produtos e serviços na API.
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

    // Busca as categorias cadastradas no banco de dados.
    this.api.listarCategorias().subscribe({
      next: dados => {
        console.log('Categorias recebidas:', dados);

        // Guarda as categorias recebidas para aparecerem no filtro.
        this.categorias = dados;
      },
      error: erro => console.log('Erro ao carregar categorias:', erro)
    });
  }

  // Permite trocar de página dentro da aplicação.
  // Quando o usuário escolhe o cadastro, a tela de cadastro é aberta.
  mostrarPagina(pagina: string): void {
    this.paginaAtual = pagina;

    if (pagina === 'cadastro') {
      this.mostrarCadastro = true;
      this.mensagemCadastro = '';
      this.erroCadastro = '';
    }
  }

  // Filtra os produtos e serviços de acordo com o que o cliente pesquisa.
  // Também verifica a categoria, o tipo e se o item está ativo.
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

  // Adiciona o produto ou serviço escolhido pelo cliente ao carrinho.
  // Se o item já estiver no carrinho, aumenta sua quantidade em vez de duplicá-lo.
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

  // Permite aumentar ou diminuir a quantidade de um produto no carrinho.
  // Caso a quantidade chegue a zero, o item é removido automaticamente.
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

  // Remove completamente um produto ou serviço do carrinho,
  // procurando pelo código do item selecionado.
  removerDoCarrinho(iditem: number): void {
    this.carrinho = this.carrinho.filter(
      linha => linha.item.iditem !== iditem
    );
  }

  // Calcula automaticamente o valor total da compra,
  // multiplicando o preço de cada item pela quantidade escolhida.
  get totalCarrinho(): number {
    return this.carrinho.reduce(
      (total, linha) => total + linha.item.preco * linha.quantidade, 0
    );
  }

  // Soma a quantidade de todos os produtos e serviços do carrinho,
  // permitindo mostrar quantos itens foram selecionados.
  get quantidadeCarrinho(): number {
    return this.carrinho.reduce(
      (total, linha) => total + linha.quantidade, 0
    );
  }

  // Abre a tela de cadastro do cliente e limpa as mensagens anteriores.
  abrirCadastro(): void {
    this.mostrarCadastro = true;
    this.mensagemCadastro = '';
    this.erroCadastro = '';
  }

  // Fecha a tela de cadastro sem realizar nenhuma alteração nos dados.
  fecharCadastro(): void {
    this.mostrarCadastro = false;
  }

  // Realiza o cadastro do cliente.
  // Primeiro verifica se os campos foram preenchidos e depois envia os dados para a API.
  cadastrarCliente(): void {
    this.mensagemCadastro = '';
    this.erroCadastro = '';

    // Verifica se algum campo obrigatório está vazio.
    // Se estiver, mostra uma mensagem e interrompe o cadastro.
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

    // Organiza as informações do cliente antes de enviá-las.
    // Também remove os caracteres especiais do CPF e telefone.
    const dados = {
      nome: this.pessoa.nome,
      cpf: parseInt(this.pessoa.cpf.replace(/\D/g, ''), 10),
      dataNascimento: this.pessoa.dataNascimento,
      sexo: this.pessoa.sexo,
      email: this.pessoa.email,
      telefone: Number(this.pessoa.telefone.replace(/\D/g, '')),
      ativoPessoa: 'S'
    };

    // Informa que o cadastro está sendo realizado.
    this.salvandoCadastro = true;

    // Envia os dados do cliente para a API e aguarda a resposta.
    this.api.cadastrarPessoa(dados).subscribe({
      next: resposta => {
        console.log('Cliente cadastrado:', resposta);

        // Guarda o código do cliente retornado pelo banco de dados.
        this.clienteId = Number(resposta.idpessoa);

        // Verifica se o cadastro retornou corretamente o código do cliente.
        if (!this.clienteId) {
          this.erroCadastro = 'Não foi possível identificar o cliente cadastrado.';
          this.salvandoCadastro = false;
          return;
        }

        // Informa que o cadastro foi realizado com sucesso.
        this.mensagemCadastro = 'Cliente cadastrado com sucesso!';
        this.erroCadastro = '';

        // Limpa os campos para deixar o formulário vazio novamente.
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

        // Se o cliente já tiver escolhido produtos, a compra é finalizada automaticamente.
        if (this.carrinho.length > 0) {
          this.mostrarCadastro = false;
          this.confirmarCompra();
        }
      },
      // Caso aconteça algum erro, mostra uma mensagem para o cliente.
      error: erro => {
        console.log(JSON.stringify(erro.error?.errors, null, 2));
        console.error('Erro ao cadastrar cliente:', erro);
        this.erroCadastro = 'Erro ao cadastrar cliente. Verifique os dados.';
        this.salvandoCadastro = false;
      }
    });
  }

  // Responsável por finalizar a compra e registrar o atendimento no sistema.
  // Antes de enviar os dados, verifica se existe algum item no carrinho
  // e se o cliente já realizou o cadastro.
  confirmarCompra(): void {
    if (this.carrinho.length === 0) {
      this.erro = 'Adicione pelo menos um item ao carrinho.';
      return;
    }

    if (!this.clienteId) {
      this.mostrarPagina('cadastro');
      this.abrirCadastro();
      this.erroCadastro = 'Cadastre seus dados antes de finalizar a compra.';
      return;
    }

    // Monta os dados da compra que serão enviados para a API.
    // Inclui o cliente, a data, o status e os produtos escolhidos.
    const atendimento = {
      idPessoa: this.clienteId,
      dataAtendimento: new Date().toISOString().split('T')[0],
      statusAtendimento: 'P',
      itens: this.carrinho.map(linha => ({
        idItem: linha.item.iditem,
        quantidade: linha.quantidade,
        valorUnitario: linha.item.preco
      }))
    };

    console.log('Dados enviados para registrar compra:', atendimento);

    // Envia as informações para a API registrar a compra no sistema.
    this.api.cadastrarAtendimento(atendimento).subscribe({
      next: () => {

        // Mostra uma mensagem confirmando que a compra foi registrada.
        alert('Compra registrada com sucesso!');

        // Limpa o carrinho e os dados temporários após finalizar a compra.
        this.carrinho = [];
        this.erro = '';
        this.clienteId = null;
        this.mostrarCadastro = false;
      },
      // Caso a API não consiga registrar a compra, mostra o erro.
      error: erro => {
        console.error('Erro ao registrar compra:', erro);
        console.error('Detalhes da API:', erro.error);

        this.erro =
          'Não foi possível registrar a compra. Verifique os dados e o estoque.';
      }
    });
  }

  // Carrega as informações necessárias para a administração.
  carregarAdministracao(): void {
    this.erroAdmin = '';

    this.api.listarPessoas().subscribe({
      next: dados => this.pessoas = dados,
      error: () => this.erroAdmin = 'Erro ao carregar clientes.'
    });

    this.api.listarFuncionarios().subscribe({
      next: dados => this.funcionarios = dados,
      error: () => this.erroAdmin = 'Erro ao carregar funcionários.'
    });

    this.api.listarAtendimentos().subscribe({
      next: dados => this.atendimentos = dados,
      error: () => this.erroAdmin = 'Erro ao carregar atendimentos.'
    });

    this.api.listarEstoque().subscribe({
      next: dados => this.estoques = dados,
      error: () => this.erroAdmin = 'Erro ao carregar estoque.'
    });

    this.api.listarEntradas().subscribe({
      next: dados => this.entradas = dados,
      error: () => this.erroAdmin = 'Erro ao carregar entradas.'
    });
  }

  // Abre a área administrativa e carrega os dados.
  abrirAdministracao(): void {
    this.paginaAtual = 'admin';
    this.paginaAdmin = 'inicio';
    this.carregarAdministracao();
  }
}
