const PALAVRAS = {
  // P — PESSOA (profissões, personagens, tipos de pessoa)
  P: ["Médico","Bombeiro","Palhaço","Astronauta","Pirata","Papai Noel","Policial","Professor","Cozinheiro",
      "Jogador de futebol","Bailarina","Mágico","Vampiro","Princesa","Super-Homem","Homem-Aranha","Batman",
      "Dentista","Carteiro","Pescador","Jardineiro","Garçom","Fotógrafo","Cantor","Pintor","Motorista de ônibus",
      "Piloto de avião","Enfermeira","Juiz","Rei","Rainha","Bruxa","Fantasma","Zumbi","Cowboy","Ninja",
      "Mergulhador","Surfista","Salva-vidas","Noiva","Bebê","Vovó","Lutador de boxe","Detetive","Cientista",
      "Sereia","Saci","Chapeuzinho Vermelho","Pinóquio","Cinderela","Frankenstein","Múmia","Goleiro",
      "Maestro","Barbeiro","Padeiro","Mecânico","Soldado","Árbitro","Gari","Alienígena","Robô","Fada"],

  // O — OBJETO
  O: ["Guarda-chuva","Tesoura","Escova de dentes","Relógio","Óculos","Chave","Celular","Televisão","Geladeira",
      "Cadeira","Bicicleta","Avião","Martelo","Vela","Lâmpada","Garrafa","Panela","Ventilador","Escada",
      "Mochila","Livro","Caneta","Violão","Bola","Balão","Pente","Travesseiro","Computador","Microfone",
      "Câmera","Telescópio","Âncora","Coroa","Sapato","Chapéu","Luva","Espelho","Liquidificador",
      "Ferro de passar","Secador de cabelo","Carrinho de mão","Pipa","Skate","Patins","Bússola","Termômetro",
      "Seringa","Cadeado","Regador","Controle remoto","Fone de ouvido","Vassoura","Cabide","Prato","Garfo",
      "Pá","Serrote","Ampulheta","Trator","Foguete","Barco","Helicóptero","Bateria (instrumento)"],

  // A — AÇÃO
  A: ["Correr","Nadar","Dormir","Pular corda","Espirrar","Dançar","Cozinhar","Pescar","Dirigir",
      "Escovar os dentes","Tomar banho","Chorar","Rir","Escalar","Voar","Cavar","Pintar","Ler","Escrever",
      "Abraçar","Varrer","Lavar louça","Passar roupa","Tricotar","Surfar","Mergulhar","Remar","Esquiar",
      "Patinar","Andar de bicicleta","Arremessar","Chutar","Bocejar","Tossir","Assobiar","Cantar","Gritar",
      "Ajoelhar","Tirar selfie","Acampar","Plantar","Serrar","Martelar","Costurar","Maquiar","Fazer a barba",
      "Fazer cócegas","Empurrar","Puxar","Tropeçar","Escorregar","Espreguiçar","Roncar","Mastigar",
      "Engolir","Piscar","Sonhar","Desmaiar","Malhar","Equilibrar","Tocar campainha","Fazer xixi","Soprar"],

  // D — DIFÍCIL (abstratos, conceitos)
  D: ["Saudade","Ciúme","Democracia","Liberdade","Internet","Eco","Gravidade","Sonho","Pesadelo","Inflação",
      "Fofoca","Preguiça","Tempo","Paz","Eleição","Aquecimento global","Arrependimento","Déjà vu","Inveja",
      "Mentira","Verdade","Silêncio","Futuro","Passado","Wi-Fi","Senha","Vírus","Evolução","Reciclagem",
      "Horóscopo","Karma","Coincidência","Nostalgia","Ironia","Imaginação","Promessa","Segredo","Vergonha",
      "Orgulho","Esperança","Destino","Fuso horário","Imposto","Burocracia","Algoritmo","Eclipse","Miragem",
      "Hipnose","Telepatia","Amizade","Medo","Curiosidade","Sorte","Azar","Ressaca","Nuvem (internet)",
      "Gratidão","Infinito","Caos","Fama","Crise","Dívida","Paciência","Teimosia"],

  // L — LAZER (diversão, esportes, passeios, festas)
  L: ["Praia","Cinema","Churrasco","Parque de diversões","Montanha-russa","Piquenique","Karaokê","Boliche",
      "Carnaval","Acampamento","Futebol","Vôlei","Xadrez","Videogame","Show de rock","Festa junina","Pescaria",
      "Piscina","Zoológico","Circo","Museu","Teatro","Balada","Sinuca","Tênis","Yoga","Academia","Trilha",
      "Paraquedismo","Bungee jump","Cruzeiro","Pipoca","Sorvete","Roda-gigante","Escorregador",
      "Esconde-esconde","Pega-pega","Amarelinha","Dominó","Baralho","Quebra-cabeça","Jardinagem",
      "Maratona de série","Fogueira","Patinação no gelo","Festa de aniversário","Ano Novo","Natal","Páscoa",
      "Basquete","Golfe","Tobogã","Cama elástica","Pula-pula","Pebolim","Ping-pong","Show de mágica",
      "Torcida","Batalha de travesseiro","Desfile","Sauna","Tirolesa"],

  // M — MIX (de tudo um pouco: animais, lugares, comidas, natureza)
  M: ["Cachorro","Gato","Elefante","Girafa","Pizza","Hambúrguer","Brasil","Torre Eiffel","Pirâmide","Vulcão",
      "Tubarão","Dinossauro","Sol","Lua","Chuva","Neve","Arco-íris","Tornado","Banana","Melancia","Cobra",
      "Macaco","Pinguim","Coelho","Galinha","Leão","Polvo","Aranha","Abelha","Borboleta","Cristo Redentor",
      "Estátua da Liberdade","Titanic","Castelo","Ilha deserta","Floresta","Deserto","Cachoeira","Fazenda",
      "Hospital","Escola","Aeroporto","Supermercado","Igreja","Pão de queijo","Brigadeiro","Café","Ovo frito",
      "Cenoura","Jacaré","Tartaruga","Camelo","Coxinha","Sushi","Cachorro-quente","Bolo de aniversário",
      "Raio","Estrela cadente","Iceberg","Farol","Ponte","Semáforo","Minhoca","Unicórnio"]
};
