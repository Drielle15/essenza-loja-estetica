
import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from './services/api';
import { finalize, timeout } from 'rxjs';

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
  cpfConsulta = '';
  buscandoCliente = false;
  mensagemCliente = '';

  // Dados utilizados na consulta de pedidos do cliente.
  pedidosCliente: any[] = [];
  carregandoPedidos = false;
  erroPedidos = '';
  mensagemPedidos = '';

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

  pessoas: any[] = [];
  funcionarios: any[] = [];
  atendimentos: any[] = [];
  estoques: any[] = [];
  entradas: any[] = [];

  paginaAdmin = 'inicio';
  erroAdmin = '';

  categoriaForm = {
    categoria: ''
  };

  categoriaEditandoId: number | null = null;
  mensagemCategoria = '';
  erroCategoria = '';

  clienteAdminForm = {
    nome: '',
    cpf: '',
    dataNascimento: '',
    sexo: '',
    email: '',
    telefone: '',
    ativoPessoa: 'S'
  };

  clienteEditandoId: number | null = null;
  mensagemClienteAdmin = '';
  erroClienteAdmin = '';

  funcionarioForm = {
    nome: '',
    cpf: '',
    dataNascimento: '',
    sexo: '',
    email: '',
    telefone: '',
    ativoPessoa: 'S',
    cargo: '',
    dataAdmissao: '',
    cep: '',
    numero: '',
    complemento: ''
  };

  funcionarioEditandoId: number | null = null;
  mensagemFuncionario = '';
  erroFuncionario = '';

  // Dados utilizados no cadastro e na edição de atendimentos.
  atendimentoForm: any = {
    idPessoa: null,
    dataAtendimento: new Date().toISOString().split('T')[0],
    statusAtendimento: 'P',
    itens: []
  };

  atendimentoEditandoId: number | null = null;
  mensagemAtendimento = '';
  erroAtendimento = '';

  // Dados utilizados no cadastro e na edição de entradas.
  entradaForm: any = {
    idItem: null,
    dataEntradaProduto: new Date().toISOString().split('T')[0],
    quantidadeEntrada: 1,
    unidade: 'UN',
    valorUnitarioEntrada: 0
  };

  entradaEditandoId: number | null = null;
  mensagemEntrada = '';
  erroEntrada = '';

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

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

    this.api.listarCategorias().subscribe({
      next: dados => {
        console.log('Categorias recebidas:', dados);
        this.categorias = dados;
      },
      error: erro => console.log('Erro ao carregar categorias:', erro)
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

  // Abre a página de consulta dos pedidos do cliente.
  abrirMeusPedidos(): void {
    this.paginaAtual = 'pedidos';
    this.erroPedidos = '';
    this.mensagemPedidos = '';
    this.pedidosCliente = [];

    if (this.clienteId) {
      this.carregarMeusPedidos();
    }
  }

  // Busca os atendimentos cadastrados para o cliente identificado.
  carregarMeusPedidos(): void {
    if (!this.clienteId) {
      this.erroPedidos = 'Informe seu CPF para consultar seus pedidos.';
      return;
    }

    this.carregandoPedidos = true;
    this.erroPedidos = '';
    this.mensagemPedidos = '';
    this.pedidosCliente = [];

    this.api.listarAtendimentos().pipe(
      timeout(10000),
      finalize(() => {
        this.carregandoPedidos = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: dados => {
        this.pedidosCliente = dados.filter((pedido: any) =>
          Number(pedido.idPessoa) === Number(this.clienteId)
        );

        if (this.pedidosCliente.length === 0) {
          this.mensagemPedidos = 'Você ainda não possui pedidos cadastrados.';
        }

        this.cdr.detectChanges();
      },
      error: erro => {
        console.error('Erro ao consultar pedidos:', erro);
        this.erroPedidos =
          'Não foi possível consultar seus pedidos. Verifique a conexão com a API.';
        this.cdr.detectChanges();
      }
    });
  }

  // Calcula o valor total de cada pedido.
  totalPedido(pedido: any): number {
    return (pedido.itens ?? []).reduce(
      (total: number, item: any) =>
        total + Number(item.valorUnitario || 0) * Number(item.quantidade || 0),
      0
    );
  }

  // Apresenta o status por extenso.
  nomeStatusPedido(status: string): string {
    switch (status) {
      case 'P':
        return 'Pendente';
      case 'C':
        return 'Concluído';
      case 'X':
        return 'Cancelado';
      default:
        return status || 'Não informado';
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

  get itensExibidos() {
    return this.itensFiltrados;
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

  localizarClientePorCpf(): void {
    this.mensagemCliente = '';
    this.clienteId = null;

    const cpfDigitado = this.cpfConsulta.replace(/\D/g, '');

    if (cpfDigitado.length !== 11) {
      this.mensagemCliente = 'Digite um CPF válido com 11 números.';
      return;
    }

    this.buscandoCliente = true;

    this.api.listarPessoas().pipe(
      timeout(10000),
      finalize(() => {
        this.buscandoCliente = false;
        this.cdr.detectChanges();
        console.log('Consulta finalizada.');
      })
    ).subscribe({
      next: pessoas => {
        console.log('Pessoas recebidas:', pessoas);
        console.log('CPF pesquisado:', cpfDigitado);

        const clienteEncontrado = pessoas.find(pessoa =>
          String(pessoa.cpf ?? '').replace(/\D/g, '') === cpfDigitado
        );

        console.log('Cliente encontrado:', clienteEncontrado);

        if (clienteEncontrado) {
          this.clienteId = Number(clienteEncontrado.idpessoa);
          this.mensagemCliente = 'Cliente identificado com sucesso!';
          this.erroCadastro = '';

          // Se a consulta foi aberta em Meus pedidos, carrega os pedidos.
          if (this.paginaAtual === 'pedidos') {
            this.carregarMeusPedidos();
          }
        } else {
          this.mensagemCliente = 'Cliente não encontrado. Faça seu cadastro.';
          this.mostrarPagina('cadastro');
          this.pessoa.cpf = this.cpfConsulta;
        }

        this.cdr.detectChanges();
      },
      error: erro => {
        console.error('Erro ao localizar cliente:', erro);
        this.mensagemCliente = 'Não foi possível consultar o cliente. Verifique a conexão com a API.';
        this.cdr.detectChanges();
      }
    });
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
        console.log('ERROS DE VALIDAÇÃO DO CLIENTE:',
          JSON.stringify(erro.error?.errors, null, 2));
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
      this.mostrarPagina('cadastro');
      this.abrirCadastro();
      this.erroCadastro = 'Cadastre seus dados antes de finalizar a compra.';
      return;
    }

    this.erro = 'Para registrar o atendimento, selecione o funcionário responsável por cada item no cadastro de atendimento da administração.';
    this.abrirAdministracao();
    this.paginaAdmin = 'atendimentos';
    this.iniciarNovoAtendimento();
  }

  carregarAdministracao(): void {
    this.erroAdmin = '';

    this.api.listarPessoas().subscribe({
      next: dados => this.pessoas = dados,
      error: () => this.erroAdmin = 'Erro ao carregar clientes.'
    });

    this.carregarFuncionarios();

    this.api.listarAtendimentos().subscribe({
      next: dados => this.atendimentos = dados,
      error: () => this.erroAdmin = 'Erro ao carregar atendimentos.'
    });

    this.api.listarEstoque().subscribe({
      next: dados => {
        console.log('Todos os estoques:', dados);
        console.log('Primeiro estoque:', dados[0]);
        this.estoques = dados;
      },
      error: () => this.erroAdmin = 'Erro ao carregar estoque.'
    });

    this.carregarEntradas();
  }

  carregarFuncionarios(): void {
    this.api.listarFuncionarios().subscribe({
      next: dados => {
        console.log('Todos os funcionários:', dados);
        console.log('Primeiro funcionário:', dados[0]);

        this.funcionarios = dados.filter(funcionario =>
          funcionario.cargo?.trim()
        );
      },
      error: () => this.erroAdmin = 'Erro ao carregar funcionários.'
    });
  }

  carregarCategorias(): void {
    this.api.listarCategorias().subscribe({
      next: dados => {
        this.categorias = dados;
      },
      error: erro => {
        console.error('Erro ao carregar categorias:', erro);
        this.erroCategoria = 'Erro ao carregar categorias.';
      }
    });
  }

  salvarCategoria(): void {
    this.mensagemCategoria = '';
    this.erroCategoria = '';

    if (!this.categoriaForm.categoria.trim()) {
      this.erroCategoria = 'Digite o nome da categoria.';
      return;
    }

    const dados = {
      categoria: this.categoriaForm.categoria.trim()
    };

    if (this.categoriaEditandoId !== null) {
      this.api.atualizarCategoria(this.categoriaEditandoId, {
        idcategoria: this.categoriaEditandoId,
        categoria: dados.categoria
      }).subscribe({
        next: () => {
          this.mensagemCategoria = 'Categoria atualizada com sucesso!';
          this.cancelarEdicaoCategoria();
          this.carregarCategorias();
        },
        error: erro => {
          console.error('Erro ao atualizar categoria:', erro);
          this.erroCategoria = 'Erro ao atualizar categoria.';
        }
      });
    } else {
      this.api.cadastrarCategoria(dados).subscribe({
        next: resposta => {
          console.log('Categoria cadastrada:', resposta);
          this.mensagemCategoria = 'Categoria cadastrada com sucesso!';
          this.categoriaForm = { categoria: '' };
          this.carregarCategorias();
        },
        error: erro => {
          console.error('Erro ao cadastrar categoria:', erro);
          this.erroCategoria = 'Erro ao cadastrar categoria.';
        }
      });
    }
  }

  editarCategoria(categoria: any): void {
    this.mensagemCategoria = '';
    this.erroCategoria = '';

    this.api.buscarCategoria(categoria.idcategoria).subscribe({
      next: dados => {
        this.categoriaEditandoId = dados.idcategoria;
        this.categoriaForm = {
          categoria: dados.categoria
        };
      },
      error: erro => {
        console.error('Erro ao buscar categoria:', erro);
        this.erroCategoria = 'Erro ao buscar categoria para edição.';
      }
    });
  }

  excluirCategoria(id: number): void {
    this.mensagemCategoria = '';
    this.erroCategoria = '';

    this.api.excluirCategoria(id).subscribe({
      next: () => {
        this.mensagemCategoria = 'Categoria excluída com sucesso!';
        this.carregarCategorias();
      },
      error: erro => {
        console.error('Erro ao excluir categoria:', erro);
        this.erroCategoria =
          'Não foi possível excluir a categoria. Verifique se existem produtos ou serviços vinculados a ela.';
      }
    });
  }

  cancelarEdicaoCategoria(): void {
    this.categoriaEditandoId = null;
    this.categoriaForm = {
      categoria: ''
    };
  }

  salvarClienteAdmin(): void {
    this.mensagemClienteAdmin = '';
    this.erroClienteAdmin = '';

    if (
      !this.clienteAdminForm.nome ||
      !this.clienteAdminForm.cpf ||
      !this.clienteAdminForm.dataNascimento ||
      !this.clienteAdminForm.sexo ||
      !this.clienteAdminForm.email ||
      !this.clienteAdminForm.telefone
    ) {
      this.erroClienteAdmin = 'Preencha todos os campos.';
      return;
    }

    const dados = {
      nome: this.clienteAdminForm.nome,
      cpf: Number(this.clienteAdminForm.cpf.replace(/\D/g, '')),
      dataNascimento: this.clienteAdminForm.dataNascimento,
      sexo: this.clienteAdminForm.sexo,
      email: this.clienteAdminForm.email,
      telefone: Number(this.clienteAdminForm.telefone.replace(/\D/g, '')),
      ativoPessoa: this.clienteAdminForm.ativoPessoa
    };

    if (this.clienteEditandoId !== null) {
      this.api.atualizarPessoa(this.clienteEditandoId, {
        idpessoa: this.clienteEditandoId,
        ...dados
      }).subscribe({
        next: () => {
          this.mensagemClienteAdmin = 'Cliente atualizado com sucesso!';
          this.cancelarEdicaoCliente();
          this.carregarAdministracao();
        },
        error: erro => {
          console.error('Erro ao atualizar cliente:', erro);
          this.erroClienteAdmin = 'Erro ao atualizar cliente.';
        }
      });
    } else {
      this.api.cadastrarPessoa(dados).subscribe({
        next: () => {
          this.mensagemClienteAdmin = 'Cliente cadastrado com sucesso!';
          this.cancelarEdicaoCliente();
          this.carregarAdministracao();
        },
        error: erro => {
          console.error('Erro ao cadastrar cliente:', erro);
          this.erroClienteAdmin = 'Erro ao cadastrar cliente.';
        }
      });
    }
  }

  editarCliente(cliente: any): void {
    this.mensagemClienteAdmin = '';
    this.erroClienteAdmin = '';

    this.api.buscarPessoa(cliente.idpessoa).subscribe({
      next: dados => {
        this.clienteEditandoId = dados.idpessoa;

        this.clienteAdminForm = {
          nome: dados.nome ?? '',
          cpf: String(dados.cpf ?? ''),
          dataNascimento: dados.dataNascimento?.substring(0, 10) ?? '',
          sexo: dados.sexo ?? '',
          email: dados.email ?? '',
          telefone: String(dados.telefone ?? ''),
          ativoPessoa: dados.ativoPessoa ?? 'S'
        };
      },
      error: erro => {
        console.error('Erro ao buscar cliente:', erro);
        this.erroClienteAdmin = 'Erro ao buscar cliente.';
      }
    });
  }

  excluirCliente(id: number): void {
    this.mensagemClienteAdmin = '';
    this.erroClienteAdmin = '';

    if (!confirm('Deseja realmente excluir este cliente?')) {
      return;
    }

    this.api.excluirPessoa(id).subscribe({
      next: () => {
        this.mensagemClienteAdmin = 'Cliente excluído com sucesso!';
        this.carregarAdministracao();
      },
      error: erro => {
        console.error('Erro ao excluir cliente:', erro);
        this.erroClienteAdmin =
          'Não foi possível excluir. Verifique se existem atendimentos vinculados ao cliente.';
      }
    });
  }

  cancelarEdicaoCliente(): void {
    this.clienteEditandoId = null;

    this.clienteAdminForm = {
      nome: '',
      cpf: '',
      dataNascimento: '',
      sexo: '',
      email: '',
      telefone: '',
      ativoPessoa: 'S'
    };
  }

  salvarFuncionario(): void {
    this.mensagemFuncionario = '';
    this.erroFuncionario = '';

    if (
      !this.funcionarioForm.nome ||
      !this.funcionarioForm.cpf ||
      !this.funcionarioForm.dataNascimento ||
      !this.funcionarioForm.sexo ||
      !this.funcionarioForm.email ||
      !this.funcionarioForm.telefone ||
      !this.funcionarioForm.cargo ||
      !this.funcionarioForm.dataAdmissao ||
      !this.funcionarioForm.cep ||
      !this.funcionarioForm.numero
    ) {
      this.erroFuncionario = 'Preencha todos os campos obrigatórios.';
      return;
    }

    const dados = {
      nome: this.funcionarioForm.nome.trim(),
      cpf: Number(this.funcionarioForm.cpf.replace(/\D/g, '')),
      dataNascimento: this.funcionarioForm.dataNascimento,
      sexo: this.funcionarioForm.sexo,
      email: this.funcionarioForm.email.trim(),
      telefone: Number(this.funcionarioForm.telefone.replace(/\D/g, '')),
      ativoPessoa: this.funcionarioForm.ativoPessoa,
      cargo: this.funcionarioForm.cargo.trim(),
      dataAdmissao: this.funcionarioForm.dataAdmissao,
      enderecos: [
        {
          cep: this.funcionarioForm.cep.replace(/\D/g, ''),
          numero: this.funcionarioForm.numero.trim(),
          complemento: this.funcionarioForm.complemento.trim()
        }
      ]
    };

    console.log('========== CADASTRO DE FUNCIONÁRIO ==========');
    console.log('JSON ENVIADO:', JSON.stringify(dados, null, 2));
    console.log('=============================================');

    if (this.funcionarioEditandoId !== null) {
      this.api.atualizarFuncionario(this.funcionarioEditandoId, {
        idPessoa: this.funcionarioEditandoId,
        ...dados
      }).subscribe({
        next: resposta => {
          console.log('Funcionário atualizado:', resposta);
          this.mensagemFuncionario = 'Funcionário atualizado com sucesso!';
          this.cancelarEdicaoFuncionario();
          this.carregarAdministracao();
        },
        error: erro => {
          console.error('ERRO AO ATUALIZAR FUNCIONÁRIO:', erro);
          console.error('DETALHES DA API:', erro.error);
          console.error(
            'ERROS DE VALIDAÇÃO:',
            JSON.stringify(erro.error?.errors, null, 2)
          );
          console.error(
            'CAMPOS REJEITADOS:',
            Object.keys(erro.error?.errors ?? {})
          );

          this.erroFuncionario =
            'Erro ao atualizar funcionário. Verifique os campos indicados no console.';
        }
      });
    } else {
      this.api.cadastrarFuncionario(dados).subscribe({
        next: resposta => {
          console.log('Funcionário cadastrado:', resposta);
          this.mensagemFuncionario = 'Funcionário cadastrado com sucesso!';
          this.cancelarEdicaoFuncionario();
          this.carregarAdministracao();
        },
        error: erro => {
          console.error('ERRO AO CADASTRAR FUNCIONÁRIO:', erro);
          console.error('DETALHES DA API:', erro.error);
          console.error(
            'ERROS DE VALIDAÇÃO:',
            JSON.stringify(erro.error?.errors, null, 2)
          );
          console.error(
            'CAMPOS REJEITADOS:',
            Object.keys(erro.error?.errors ?? {})
          );

          this.erroFuncionario =
            'Erro ao cadastrar funcionário. Verifique os campos indicados no console.';
        }
      });
    }
  }

  editarFuncionario(funcionario: any): void {
    this.mensagemFuncionario = '';
    this.erroFuncionario = '';

    const id = Number(funcionario.idPessoa ?? funcionario.idpessoa);

    if (!id) {
      this.erroFuncionario = 'Não foi possível identificar o funcionário.';
      return;
    }

    this.api.buscarFuncionario(id).subscribe({
      next: dados => {
        console.log('Funcionário encontrado para edição:', dados);

        this.funcionarioEditandoId = Number(dados.idPessoa ?? dados.idpessoa);

        const endereco = dados.enderecos?.[0] ?? {};

        this.funcionarioForm = {
          nome: dados.nome ?? '',
          cpf: String(dados.cpf ?? ''),
          dataNascimento: dados.dataNascimento?.substring(0, 10) ?? '',
          sexo: dados.sexo ?? '',
          email: dados.email ?? '',
          telefone: String(dados.telefone ?? ''),
          ativoPessoa: dados.ativoPessoa ?? 'S',
          cargo: dados.cargo ?? '',
          dataAdmissao: dados.dataAdmissao?.substring(0, 10) ?? '',
          cep: String(endereco.cep ?? ''),
          numero: String(endereco.numero ?? ''),
          complemento: endereco.complemento ?? ''
        };
      },
      error: erro => {
        console.error('Erro ao buscar funcionário:', erro);
        console.error('Detalhes da API:', erro.error);
        this.erroFuncionario = 'Erro ao buscar funcionário para edição.';
      }
    });
  }

  excluirFuncionario(id: number): void {
    this.mensagemFuncionario = '';
    this.erroFuncionario = '';

    if (!confirm('Deseja realmente excluir este funcionário?')) {
      return;
    }

    this.api.excluirFuncionario(id).subscribe({
      next: () => {
        this.mensagemFuncionario = 'Funcionário excluído com sucesso!';
        this.carregarAdministracao();
      },
      error: erro => {
        console.error('Erro ao excluir funcionário:', erro);
        console.error('Detalhes da API:', erro.error);
        this.erroFuncionario =
          'Não foi possível excluir o funcionário. Verifique se existem atendimentos vinculados a ele.';
      }
    });
  }

  cancelarEdicaoFuncionario(): void {
    this.funcionarioEditandoId = null;

    this.funcionarioForm = {
      nome: '',
      cpf: '',
      dataNascimento: '',
      sexo: '',
      email: '',
      telefone: '',
      ativoPessoa: 'S',
      cargo: '',
      dataAdmissao: '',
      cep: '',
      numero: '',
      complemento: ''
    };
  }

  iniciarNovoAtendimento(): void {
    this.atendimentoEditandoId = null;
    this.mensagemAtendimento = '';
    this.erroAtendimento = '';

    this.atendimentoForm = {
      idPessoa: null,
      dataAtendimento: new Date().toISOString().split('T')[0],
      statusAtendimento: 'P',
      itens: [this.novoItemAtendimento()]
    };

    if (this.funcionarios.length === 0) {
      this.carregarFuncionarios();
    }
  }

  novoItemAtendimento(): any {
    return {
      idItem: null,
      idFuncionario: null,
      quantidade: 1,
      valorUnitario: 0
    };
  }

  adicionarItemAtendimento(): void {
    this.atendimentoForm.itens.push(this.novoItemAtendimento());
  }

  removerItemAtendimento(indice: number): void {
    this.atendimentoForm.itens.splice(indice, 1);
  }

  selecionarItemAtendimento(linha: any): void {
    const item = this.itens.find(
      elemento => Number(elemento.iditem) === Number(linha.idItem)
    );

    if (item) {
      linha.valorUnitario = Number(item.preco);
    }
  }

  salvarAtendimento(): void {
    this.mensagemAtendimento = '';
    this.erroAtendimento = '';

    if (
      !this.atendimentoForm.idPessoa ||
      !this.atendimentoForm.dataAtendimento ||
      !this.atendimentoForm.statusAtendimento
    ) {
      this.erroAtendimento = 'Selecione o cliente, a data e o status.';
      return;
    }

    if (!this.atendimentoForm.itens.length) {
      this.erroAtendimento = 'Adicione pelo menos um produto ou serviço.';
      return;
    }

    const itemInvalido = this.atendimentoForm.itens.some((linha: any) =>
      !linha.idItem ||
      !linha.idFuncionario ||
      !linha.quantidade ||
      Number(linha.quantidade) <= 0 ||
      linha.valorUnitario === null ||
      linha.valorUnitario === '' ||
      Number(linha.valorUnitario) < 0
    );

    if (itemInvalido) {
      this.erroAtendimento =
        'Preencha o produto/serviço, o funcionário, a quantidade e o valor de cada item.';
      return;
    }

    const dados = {
      idPessoa: Number(this.atendimentoForm.idPessoa),
      dataAtendimento: this.atendimentoForm.dataAtendimento,
      statusAtendimento: this.atendimentoForm.statusAtendimento,
      itens: this.atendimentoForm.itens.map((linha: any) => ({
        idItem: Number(linha.idItem),
        idFuncionario: Number(linha.idFuncionario),
        quantidade: Number(linha.quantidade),
        valorUnitario: Number(linha.valorUnitario)
      }))
    };

    console.log('Atendimento enviado:', dados);

    if (this.atendimentoEditandoId !== null) {
      this.api.atualizarAtendimento(this.atendimentoEditandoId, dados).subscribe({
        next: () => {
          this.mensagemAtendimento = 'Atendimento atualizado com sucesso!';
          this.cancelarEdicaoAtendimento();
          this.carregarAtendimentos();
        },
        error: erro => {
          console.error('Erro ao atualizar atendimento:', erro);
          console.error('Detalhes da API:', erro.error);
          this.erroAtendimento =
            'Erro ao atualizar atendimento. Verifique os dados enviados.';
        }
      });
    } else {
      this.api.cadastrarAtendimento(dados).subscribe({
        next: resposta => {
          console.log('Atendimento cadastrado:', resposta);
          this.mensagemAtendimento = 'Atendimento cadastrado com sucesso!';
          this.cancelarEdicaoAtendimento();
          this.carregarAtendimentos();
        },
        error: erro => {
          console.error('Erro ao cadastrar atendimento:', erro);
          console.error('Detalhes da API:', erro.error);
          this.erroAtendimento =
            'Erro ao cadastrar atendimento. Verifique os dados enviados.';
        }
      });
    }
  }

  editarAtendimento(atendimento: any): void {
    this.mensagemAtendimento = '';
    this.erroAtendimento = '';

    this.api.buscarAtendimento(atendimento.idAtendimento).subscribe({
      next: dados => {
        console.log('Atendimento para edição:', dados);

        this.atendimentoEditandoId = Number(dados.idAtendimento);

        this.atendimentoForm = {
          idPessoa: Number(dados.idPessoa),
          dataAtendimento: dados.dataAtendimento?.substring(0, 10) ?? '',
          statusAtendimento: dados.statusAtendimento ?? 'P',
          itens: (dados.itens ?? []).map((linha: any) => ({
            idItem: Number(linha.idItem),
            idFuncionario: Number(linha.idFuncionario),
            quantidade: Number(linha.quantidade),
            valorUnitario: Number(linha.valorUnitario)
          }))
        };

        if (this.atendimentoForm.itens.length === 0) {
          this.atendimentoForm.itens = [this.novoItemAtendimento()];
        }

        this.paginaAdmin = 'atendimentos';

        if (this.funcionarios.length === 0) {
          this.carregarFuncionarios();
        }
      },
      error: erro => {
        console.error('Erro ao buscar atendimento:', erro);
        this.erroAtendimento = 'Erro ao buscar atendimento para edição.';
      }
    });
  }

  excluirAtendimento(id: number): void {
    this.mensagemAtendimento = '';
    this.erroAtendimento = '';

    if (!confirm('Deseja realmente excluir este atendimento?')) {
      return;
    }

    this.api.excluirAtendimento(id).subscribe({
      next: () => {
        this.mensagemAtendimento = 'Atendimento excluído com sucesso!';
        this.carregarAtendimentos();
      },
      error: erro => {
        console.error('Erro ao excluir atendimento:', erro);
        console.error('Detalhes da API:', erro.error);
        this.erroAtendimento =
          'Não foi possível excluir o atendimento. Verifique os dados vinculados.';
      }
    });
  }

  cancelarEdicaoAtendimento(): void {
    this.atendimentoEditandoId = null;

    this.atendimentoForm = {
      idPessoa: null,
      dataAtendimento: new Date().toISOString().split('T')[0],
      statusAtendimento: 'P',
      itens: [this.novoItemAtendimento()]
    };
  }

  // Existe apenas uma implementação deste método.
  carregarAtendimentos(): void {
    this.api.listarAtendimentos().subscribe({
      next: dados => this.atendimentos = dados,
      error: erro => {
        console.error('Erro ao carregar atendimentos:', erro);
        this.erroAtendimento = 'Erro ao atualizar a lista de atendimentos.';
      }
    });
  }

  salvarEntrada(): void {
    this.mensagemEntrada = '';
    this.erroEntrada = '';

    if (
      !this.entradaForm.idItem ||
      !this.entradaForm.dataEntradaProduto ||
      !this.entradaForm.quantidadeEntrada ||
      Number(this.entradaForm.quantidadeEntrada) <= 0 ||
      !this.entradaForm.unidade?.trim() ||
      this.entradaForm.valorUnitarioEntrada === null ||
      this.entradaForm.valorUnitarioEntrada === '' ||
      Number(this.entradaForm.valorUnitarioEntrada) < 0
    ) {
      this.erroEntrada = 'Preencha todos os campos corretamente.';
      return;
    }

    const dados = {
      idItem: Number(this.entradaForm.idItem),
      dataEntradaProduto: this.entradaForm.dataEntradaProduto,
      quantidadeEntrada: Number(this.entradaForm.quantidadeEntrada),
      unidade: this.entradaForm.unidade.trim(),
      valorUnitarioEntrada: Number(this.entradaForm.valorUnitarioEntrada)
    };

    console.log('Dados enviados para entrada:', dados);

    if (this.entradaEditandoId !== null) {
      this.api.atualizarEntrada(this.entradaEditandoId, {
        idEntradaProduto: this.entradaEditandoId,
        ...dados
      }).subscribe({
        next: () => {
          this.mensagemEntrada = 'Entrada atualizada com sucesso!';
          this.cancelarEdicaoEntrada();
          this.carregarEntradas();
        },
        error: erro => {
          console.error('Erro ao atualizar entrada:', erro);
          console.error('Detalhes da API:', erro.error);
          this.erroEntrada = 'Erro ao atualizar entrada. Verifique os dados.';
        }
      });
    } else {
      this.api.cadastrarEntrada(dados).subscribe({
        next: resposta => {
          console.log('Entrada cadastrada:', resposta);
          this.mensagemEntrada = 'Entrada cadastrada com sucesso!';
          this.cancelarEdicaoEntrada();
          this.carregarEntradas();
        },
        error: erro => {
          console.error('Erro ao cadastrar entrada:', erro);
          console.error('Detalhes da API:', erro.error);
          this.erroEntrada = 'Erro ao cadastrar entrada. Verifique os dados.';
        }
      });
    }
  }

  editarEntrada(entrada: any): void {
    this.mensagemEntrada = '';
    this.erroEntrada = '';

    this.api.buscarEntrada(entrada.idEntradaProduto).subscribe({
      next: dados => {
        console.log('Entrada para edição:', dados);

        this.entradaEditandoId = Number(dados.idEntradaProduto);

        this.entradaForm = {
          idItem: Number(dados.idItem),
          dataEntradaProduto: dados.dataEntradaProduto?.substring(0, 10) ?? '',
          quantidadeEntrada: Number(dados.quantidadeEntrada),
          unidade: dados.unidade ?? 'UN',
          valorUnitarioEntrada: Number(dados.valorUnitarioEntrada)
        };
      },
      error: erro => {
        console.error('Erro ao buscar entrada:', erro);
        this.erroEntrada = 'Erro ao buscar entrada para edição.';
      }
    });
  }

  excluirEntrada(id: number): void {
    this.mensagemEntrada = '';
    this.erroEntrada = '';

    if (!confirm('Deseja realmente excluir esta entrada de produto?')) {
      return;
    }

    this.api.excluirEntrada(id).subscribe({
      next: () => {
        this.mensagemEntrada = 'Entrada excluída com sucesso!';
        this.carregarEntradas();
      },
      error: erro => {
        console.error('Erro ao excluir entrada:', erro);
        console.error('Detalhes da API:', erro.error);
        this.erroEntrada = 'Não foi possível excluir a entrada.';
      }
    });
  }

  cancelarEdicaoEntrada(): void {
    this.entradaEditandoId = null;

    this.entradaForm = {
      idItem: null,
      dataEntradaProduto: new Date().toISOString().split('T')[0],
      quantidadeEntrada: 1,
      unidade: 'UN',
      valorUnitarioEntrada: 0
    };
  }

  carregarEntradas(): void {
    this.api.listarEntradas().subscribe({
      next: dados => {
        console.log('Entradas atualizadas:', dados);
        this.entradas = dados;
      },
      error: erro => {
        console.error('Erro ao carregar entradas:', erro);
        this.erroEntrada = 'Erro ao atualizar a lista de entradas.';
      }
    });
  }

  abrirAdministracao(): void {
    this.paginaAtual = 'admin';
    this.paginaAdmin = 'inicio';
    console.log('Painel administrativo aberto!');
    this.carregarAdministracao();
  }

  nomeItem(id: number): string {
    const item = this.itens.find(item => item.iditem === id);
    return item ? item.item1 : `Item #${id}`;
  }
}
