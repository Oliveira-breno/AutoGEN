AutoGEN
O seu consultor automotivo inteligente movido a Inteligencia Artificial

O AutoGEN cruza dados oficiais da Tabela FIPE com anuncios reais da OLX e utiliza a IA do Google Gemini para entregar analises de mercado, alertas de problemas cronicos e sugestoes de alternativas na mesma faixa de preco.

Sobre o Projeto
Comprar um carro usado no Brasil exige cruzar diversas informacoes: o preco idealizado da Tabela FIPE, a realidade do mercado nos classificados e o conhecimento tecnico sobre o veiculo, como manutencao, revenda e custo-beneficio. O AutoGEN automatiza e enriquece esse processo. Ele coleta os dados oficiais da FIPE, raspa anuncios reais na OLX em tempo real e envia esse pacote de dados para o modelo de linguagem Gemini. A IA processa as informacoes e devolve uma interface rica, inspirada na estetica muscle car e glassmorphism, contendo o veredito final para o comprador.

Funcionalidades Principais
Selecao em Cascata (API FIPE): Menus dinamicos que carregam Marcas, Modelos e Anos diretamente da base oficial da Parallelum.
Web Scraping Resiliente (OLX): Backend em Flask com rotas que buscam anuncios reais, aplicando Regex para limpeza de precos e quilometragem, alem de filtros contra pecas e acessorios.
Analise com IA Generativa: Integracao com a API do Google Gemini para gerar resumos de mercado, pros e contras e alternativas de compra.
Rodizio Automatico de Chaves: Insercao de multiplas chaves API pelo usuario. O sistema possui fallback e retry automatico. Se uma chave estourar o limite ou o servidor oscilar, ele tenta a proxima instantaneamente sem quebrar a aplicacao.
UI/UX Premium: Interface responsiva com efeitos de desfoque, tipografia agressiva e transicoes suaves.

Arquitetura e Fluxo

1. Input do Usuario: Insercao das Chaves API e selecao do veiculo.
2. Fetch 1 (Oficial): Consulta o valor de referencia na Tabela FIPE.
3. Fetch 2 (Mercado Real): Aciona o backend Flask em Python que faz o scraping na OLX e devolve os anuncios em formato JSON.
4. Fetch 3 (IA): Envia o contexto completo para o Gemini, forcando a saida em JSON.
5. Renderizacao: O JavaScript converte o JSON da IA em widgets, tabelas e cards na tela.

Tecnologias Utilizadas
Front-end: HTML5, CSS3, Vanilla JavaScript (ES6+, Async/Await, Fetch API).
Back-end e Scraping: Python 3, Flask, Flask-CORS, BeautifulSoup4, Regex e Requests.
Inteligencia Artificial: Google Gemini API.

Como Rodar o Projeto
Pre-requisitos: Editor de codigo como o VS Code com a extensao Live Server, Miniconda ou Python instalado no sistema e uma chave de API gratuita do Google AI Studio.

Passo 1: Clone o repositorio e acesse a pasta do projeto.
Passo 2: Configure e inicie o Back-end em Python. Abra o terminal na pasta do projeto e instale as dependencias com o comando: pip install flask flask-cors beautifulsoup4 requests. Em seguida, inicie o servidor Flask com o comando: python Api.py. O terminal exibira que a aplicacao esta rodando na porta 8000 local.
Passo 3: Inicie o Front-end. Abra o arquivo index.html no VS Code e clique no botao Go Live no canto inferior direito para iniciar o Live Server. O navegador abrira automaticamente a aplicacao. Insira sua chave da API do Gemini e comece a testar.

Demonstração Visual do Sistema
A interface foi dividida em cinco partes principais que funcionam em conjunto. Primeiro, a gestao de chaves API segura, onde o sistema permite inserir diversas chaves simultaneamente, garantindo a alta disponibilidade da aplicacao. Segundo, o buscador dinamico via FIPE, com campos travados sequencialmente para garantir consultas exatas para o banco de dados. Terceiro, o veredito da Inteligencia Artificial, que traz uma analise direta ao ponto informando se a compra vale a pena e destacando caracteristicas ocultas do modelo. Quarto, os dados reais de classificados, onde o backend busca veiculos equivalentes anunciados na OLX com link direto para o anuncio. E quinto, a sugestao de alternativas, onde o Gemini utiliza a faixa de preco oficial para recomendar outros veiculos, montando cards informativos de pros e contras de cada opcao.
