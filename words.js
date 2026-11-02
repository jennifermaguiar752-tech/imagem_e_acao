const PALAVRAS = {
  // P — PESSOA
  P: ["Médico","Bombeiro","Palhaço","Astronauta","Pirata","Papai Noel","Policial","Professor","Cozinheiro",
      "Jogador de futebol","Bailarina","Mágico","Vampiro","Princesa","Super-Homem","Homem-Aranha","Batman",
      "Dentista","Carteiro","Pescador","Garçom","Fotógrafo","Cantor de ópera","Pintor","Motorista de ônibus",
      "Piloto de avião","Juiz","Rei","Bruxa","Fantasma","Zumbi","Cowboy","Ninja","Mergulhador","Surfista",
      "Salva-vidas","Noiva","Bebê","Vovó","Lutador de boxe","Detetive","Cientista maluco","Sereia","Saci",
      "Pinóquio","Frankenstein","Múmia","Goleiro","Maestro","Barbeiro","Mecânico","Soldado","Árbitro",
      "Robô","Mímico","Halterofilista","Guarda de trânsito","DJ","Modelo na passarela","Tarzan","Estátua viva",
      "Homem das cavernas","Cego","Bêbado","Nadador","Capoeirista","Personal trainer","Dançarina de axé"],

  // O — OBJETO
  O: ["Guarda-chuva","Tesoura","Escova de dentes","Relógio","Óculos","Chave","Celular","Televisão","Geladeira",
      "Bicicleta","Avião","Martelo","Vela","Lâmpada","Panela","Ventilador","Escada","Mochila","Livro",
      "Violão","Bola","Balão","Travesseiro","Computador","Microfone","Câmera fotográfica","Binóculo","Coroa",
      "Sapato de salto","Chapéu","Luva de boxe","Espelho","Liquidificador","Ferro de passar","Secador de cabelo",
      "Carrinho de mão","Pipa","Skate","Patins","Termômetro","Seringa","Cadeado","Regador","Controle remoto",
      "Fone de ouvido","Vassoura","Saca-rolhas","Furadeira","Serrote","Trator","Foguete","Barco","Helicóptero",
      "Bateria (instrumento)","Piano","Pula-pula","Bambolê","Batom","Moto","Máquina de costura","Cortador de grama",
      "Chiclete","Pirulito","Mouse","Extintor","Elevador","Bumerangue","Arco e flecha","Paraquedas"],

  // A — AÇÃO
  A: ["Correr","Nadar","Dormir","Pular corda","Espirrar","Dançar","Cozinhar","Pescar","Dirigir",
      "Escovar os dentes","Tomar banho","Chorar","Rir","Escalar","Voar","Cavar","Pintar parede","Ler","Escrever",
      "Abraçar","Varrer","Lavar louça","Passar roupa","Tricotar","Surfar","Mergulhar","Remar","Esquiar",
      "Patinar","Andar de bicicleta","Arremessar","Chutar","Bocejar","Tossir","Assobiar","Cantar","Ajoelhar",
      "Tirar selfie","Acampar","Plantar","Serrar","Costurar","Maquiar","Fazer a barba","Fazer cócegas",
      "Empurrar","Puxar","Tropeçar","Escorregar","Espreguiçar","Roncar","Mastigar","Piscar","Desmaiar",
      "Malhar","Equilibrar","Soprar","Ordenhar vaca","Trocar fralda","Carregar no colo","Levar choque",
      "Pisar em chiclete","Andar na corda bamba","Pegar ônibus lotado","Procurar a chave","Matar mosquito"],

  // D — DIFÍCIL (abstratos e expressões)
  D: ["Saudade","Ciúme","Liberdade","Internet","Eco","Gravidade","Pesadelo","Fofoca","Preguiça","Paz",
      "Eleição","Aquecimento global","Arrependimento","Déjà vu","Inveja","Mentira","Silêncio","Futuro",
      "Passado","Wi-Fi","Senha","Reciclagem","Horóscopo","Coincidência","Vergonha","Orgulho","Esperança",
      "Fuso horário","Imposto","Burocracia","Eclipse","Miragem","Hipnose","Telepatia","Amizade","Curiosidade",
      "Sorte","Azar","Ressaca","Gratidão","Fama","Dívida","Paciência","Teimosia","Câmera lenta","Gravidez",
      "Cair a ficha","Pagar mico","Chutar o balde","Dar uma de João-sem-braço","Engolir sapo","Pisar na bola",
      "Ficar de molho","Matar dois coelhos com uma cajadada","Quem não chora não mama","Fazer vaquinha",
      "Dor de cotovelo","Chorar pelo leite derramado","Segurar vela","Ter um parafuso a menos","Lavar a égua",
      "Estar com a pulga atrás da orelha","Tirar o cavalinho da chuva","Mão de vaca"],

  // L — LAZER
  L: ["Praia","Cinema","Churrasco","Parque de diversões","Montanha-russa","Piquenique","Karaokê","Boliche",
      "Carnaval","Acampamento","Futebol","Vôlei","Xadrez","Videogame","Show de rock","Festa junina",
      "Pescaria","Piscina","Zoológico","Circo","Teatro","Balada","Sinuca","Tênis","Yoga","Academia","Trilha",
      "Paraquedismo","Bungee jump","Cruzeiro","Roda-gigante","Escorregador","Esconde-esconde","Pega-pega",
      "Amarelinha","Dominó","Baralho","Quebra-cabeça","Maratona de série","Fogueira","Patinação no gelo",
      "Festa de aniversário","Ano Novo","Natal","Páscoa","Basquete","Golfe","Tobogã","Cama elástica",
      "Pebolim","Ping-pong","Torcida","Guerra de travesseiro","Sauna","Tirolesa","Rafting","Cabo de guerra",
      "Dança da cadeira","Corrida de saco","Quadrilha","Hipismo","Esgrima","Judô","Stand up paddle"],

  // M — MIX (animais, lugares, comidas, filmes...)
  M: ["Cachorro","Gato","Elefante","Girafa","Pizza","Hambúrguer","Torre Eiffel","Pirâmide","Vulcão",
      "Tubarão","Dinossauro","Chuva","Neve","Tornado","Banana","Melancia","Cobra","Macaco","Pinguim","Coelho",
      "Galinha","Leão","Polvo","Aranha","Abelha","Borboleta","Cristo Redentor","Estátua da Liberdade",
      "Titanic","Ilha deserta","Cachoeira","Fazenda","Hospital","Aeroporto","Supermercado","Sorvete",
      "Pipoca","Jacaré","Tartaruga","Camelo","Sushi","Espaguete","Milho cozido","Canguru","Sapo","Cavalo",
      "Caranguejo","Pavão","Raio","Terremoto","Semáforo","Minhoca","Unicórnio","O Rei Leão","Harry Potter",
      "Star Wars","Tropa de Elite","Procurando Nemo","Shrek","Jurassic Park","Missão Impossível","Frozen",
      "Toy Story","Homem de Ferro","Big Brother","Copa do Mundo","Olimpíadas"]
};
