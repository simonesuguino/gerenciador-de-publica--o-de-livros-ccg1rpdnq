migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const booksCol = app.findCollectionByNameOrId('books')
    const chaptersCol = app.findCollectionByNameOrId('chapters')
    const checklistCol = app.findCollectionByNameOrId('checklist_items')

    // 1. Seed initial author user (simonesuguino@gmail.com / Skip@Pass)
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'simonesuguino@gmail.com')
    } catch (_) {
      user = new Record(usersCol)
      user.setEmail('simonesuguino@gmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Simone Suguino')
      app.save(user)
    }

    // 2. Check if book already exists
    let book
    try {
      book = app.findFirstRecordByData('books', 'title', 'Cavalo de Tróia')
    } catch (_) {
      book = new Record(booksCol)
      book.set('title', 'Cavalo de Tróia')
      book.set('subtitle', 'Memórias de uma jornada por dentro das fortalezas invisíveis')
      book.set(
        'synopsis',
        'Um relato autobiográfico profundo e envolvente sobre travessias, desconstruções e os portões que precisamos abrir dentro de nós mesmos. Cavalo de Tróia é o testemunho corajoso de quem desafiou as expectativas, enfrentou muralhas emocionais e descobriu que a maior coragem é entrar desarmado na própria história.',
      )
      book.set(
        'cover_url',
        'https://img.usecurling.com/p/800/1200?q=book%20cover%20classic%20horse&color=orange',
      )
      book.set('isbn', '978-65-00-12345-6')
      book.set('price', 49.9)
      book.set('target_words', 55000)
      book.set('genre', 'Memoir / Autobiografia')
      book.set(
        'buy_links',
        JSON.stringify([
          { label: 'Amazon Kindle', url: 'https://amazon.com.br' },
          { label: 'Kobo Rakuten', url: 'https://kobo.com' },
          { label: 'Apple Books', url: 'https://apple.com/apple-books' },
        ]),
      )
      app.save(book)
    }

    // 3. Seed chapters for "Cavalo de Tróia" (Memoir structure: Prólogo + 8 capítulos + Epílogo)
    const initialChapters = [
      {
        title: 'Prólogo: As Muralhas Antes da Queda',
        position: 1,
        content: `Todo monumento erguido pela memória parece inabalável até que a primeira fresta de luz o atravesse. Cresci acreditando que certas fortalezas existiam para me proteger do mundo exterior, sem perceber que elas também me mantinham refém do que não ousava nomear.\n\nEra uma tarde de outono quando compreendi, pela primeira vez, o peso de carregar segredos que não eram meus. A cidade ao longe silenciava enquanto os ponteiros do relógio na parede da sala insistiam em marcar um tempo que já não me pertencia.\n\nEste livro não é um pedido de desculpas, tampouco uma acusação. É, antes de tudo, o inventário de uma sobrevivência. Uma tentativa honesta de olhar nos olhos daquela que fui e dizer-lhe: nós conseguimos atravessar.`,
        narration_script: `[TOM DE VOZ: reflexivo, intimista, ritmo calmo. Pausa de 2 segundos após a primeira frase.]\n\nTodo monumento erguido pela memória parece inabalável até que a primeira fresta de luz o atravesse.\n\n[Respiração natural]\n\nCresci acreditando que certas fortalezas existiam para me proteger do mundo exterior...`,
        recording_status: 'gravado',
      },
      {
        title: 'Capítulo 1: O Presente que Ninguém Pediu',
        position: 2,
        content: `A metáfora do presente grego sempre me pareceu poética demais para descrever a crueldade do cotidiano. Em nossa família, os gestos de generosidade vinham frequentemente embrulhados em cobranças futuras, com juros emocionais que nunca cessavam de acumular.\n\nLembro-me daquela manhã de sábado, da xícara de café frio deixada sobre o aparador de mogno, e da conversa truncada que mudaria para sempre a rota dos meus passos. Havia ali um pacto velado de silêncio, uma armadura que todos vestiam como se fosse linho fino.`,
        narration_script: `[TOM: direto, com certa ironia sutil no início, caminhando para a vulnerabilidade.]\n\nA metáfora do presente grego sempre me pareceu poética demais para descrever a crueldade do cotidiano...`,
        recording_status: 'revisado',
      },
      {
        title: 'Capítulo 2: Vozes Atrás da Madeira',
        position: 3,
        content: `No silêncio da noite, os sons de uma casa revelam muito mais do que os discursos diurnos. Eu conhecia o ranger de cada tábua do assoalho, o estalo das telhas sob o vento e as palavras abafadas que escapavam pelas frestas da porta fechada do escritório.\n\nFoi ali, agachada no topo da escada com os joelhos colados ao peito, que aprendi a decifrar a linguagem do medo disfarçado de disciplina.`,
        narration_script: `[TOM: suspense e ternura infantil. Falar um pouco mais baixo nas passagens sobre a escada.]`,
        recording_status: 'pendente',
      },
      {
        title: 'Capítulo 3: Primeiro Exílio',
        position: 4,
        content: `Partir não é um ato único de coragem; é uma sucessão exaustiva de pequenas despedidas. A mala pesada de lona azul no porta-malas do carro continha apenas uma fração dos meus livros e um punhado de roupas que pareciam não pertencer mais a ninguém.\n\nQuando a estrada começou a serpentear para fora dos limites da cidade natal, senti no peito a estranha vertigem da liberdade — uma mistura aguda de náusea e esperança.`,
        narration_script: `[TOM: nostálgico, ritmo de viagem, respiração mais espaçada.]`,
        recording_status: 'pendente',
      },
      {
        title: 'Capítulo 4: O Labirinto das Expectativas',
        position: 5,
        content: `Na metrópole, descobri que construir uma nova identidade custa caro. Ninguém ali se importava com os sobrenomes ou com as dívidas ancestrais que eu carregava, mas o vácuo de pertencimento exigia um esforço diário de reinvenção.\n\nTrabalhar até a exaustão tornou-se meu anestésico favorito. Se o corpo estivesse cansado o suficiente, a mente não teria fôlego para fazer perguntas perigosas.`,
        narration_script: `[TOM: acelerado no início para refletir o ritmo urbano, desacelerando ao final.]`,
        recording_status: 'pendente',
      },
      {
        title: 'Capítulo 5: Fissuras na Armadura',
        position: 6,
        content: `O colapso nunca chega com trombetas ou terremotos estrondosos; ele se infiltra num detalhe banal — uma chave esquecida, um copo de água que escorrega dos dedos trêmulos, uma lágrima involuntária no meio de uma reunião ordinária.\n\nAquele telefonema numa terça-feira chuvosa rompeu de vez o dique que vinha contendo dez anos de silêncio represado.`,
        narration_script: `[TOM: pesado, emocionalmente carregado, sem exageros melodramáticos.]`,
        recording_status: 'pendente',
      },
      {
        title: 'Capítulo 6: O Ventre do Monstro',
        position: 7,
        content: `Para desarmar uma bomba, é preciso entrar na sala onde ela foi plantada. O retorno à casa dos meus pais depois de tantos anos teve o sabor acre de uma capitulação aparente.\n\nMas eu não era mais a jovem que fugira com a mala de lona. Havia agora uma distância lúcida, um olhar capaz de ver a dor nas mãos envelhecidas daqueles que um dia julguei gigantes invencíveis.`,
        narration_script: `[TOM: maduro, firme, compassivo.]`,
        recording_status: 'pendente',
      },
      {
        title: 'Capítulo 7: Fogo Purificador',
        position: 8,
        content: `Perdoar não significa concordar com o que aconteceu, nem fingir que as cicatrizes não existem. Perdoar é simplesmente renunciar ao direito de esperar um passado diferente.\n\nQueimei velhas cartas numa lata de metal no quintal dos fundos. A fumaça escura subiu em direção ao céu limpo da manhã, dissipando o que restava do veneno acumulado.`,
        narration_script: `[TOM: solene, alívio, tom conclusivo e libertador.]`,
        recording_status: 'pendente',
      },
      {
        title: 'Capítulo 8: A Cidade Reconstruída',
        position: 9,
        content: `A vida não recomeça do zero; ela se ergue sobre os escombros com materiais mais nobres e fundações mais honestas. Aprendi a construir pontes onde antes só existiam pontes levadiças fechadas com correntes enferrujadas.`,
        narration_script: `[TOM: luminoso, sereno, encorajador.]`,
        recording_status: 'pendente',
      },
      {
        title: 'Epílogo: Os Portões Abertos',
        position: 10,
        content: `Hoje, quando olho para trás, não vejo mais um campo de batalha, mas um mapa de travessia. As portas da cidade continuam abertas — não porque não haja perigo no horizonte, mas porque aprendi que a verdadeira segurança nasce da coragem de permanecer vulnerável.\n\nSe você segura este livro agora, que ele sirva como um sussurro amigo: não tema os cavalos de madeira que a vida lhe apresentar; dentro deles pode estar o exército que libertará você de si mesmo.`,
        narration_script: `[TOM: caloroso, direto ao leitor, despedida íntima e marcante.]`,
        recording_status: 'pendente',
      },
    ]

    const existingCount = app.countRecords('chapters')
    if (existingCount === 0) {
      for (const chap of initialChapters) {
        const rec = new Record(chaptersCol)
        rec.set('book_id', book.id)
        rec.set('title', chap.title)
        rec.set('content', chap.content)
        rec.set('position', chap.position)
        rec.set('narration_script', chap.narration_script)
        rec.set('recording_status', chap.recording_status)
        app.save(rec)
      }
    }

    // 4. Seed checklist items
    const platforms = [
      {
        platform: 'Amazon KDP (Kindle Direct Publishing)',
        platform_key: 'kdp',
        link: 'https://kdp.amazon.com',
        notes: 'Conta criada e dados bancários validados. Faltando arquivo final do EPUB.',
        completed: false,
        position: 1,
      },
      {
        platform: 'Kobo Writing Life',
        platform_key: 'kobo',
        link: 'https://kobo.com/writinglife',
        notes: 'Distribuição para leitores Kobo e Livraria Cultura.',
        completed: false,
        position: 2,
      },
      {
        platform: 'Apple Books for Authors',
        platform_key: 'apple',
        link: 'https://authors.apple.com',
        notes: 'Cadastro via Apple ID de autor.',
        completed: false,
        position: 3,
      },
      {
        platform: 'IngramSpark (Impressão sob Demanda)',
        platform_key: 'ingram',
        link: 'https://www.ingramspark.com',
        notes: 'Para distribuição global impressa e brochura capa comum.',
        completed: false,
        position: 4,
      },
      {
        platform: 'Google Play Livros Parceiros',
        platform_key: 'google',
        link: 'https://play.google.com/books/publish',
        notes: 'Painel de parceiros do Google.',
        completed: false,
        position: 5,
      },
      {
        platform: 'CBL / ISBN Brasil',
        platform_key: 'cbl',
        link: 'https://servicos.cbl.org.br',
        notes: 'Registro de ISBN e Ficha Catalográfica na Câmara Brasileira do Livro.',
        completed: true,
        position: 6,
      },
      {
        platform: 'Registro de Direitos Autorais (BN)',
        platform_key: 'bn',
        link: 'https://www.bn.gov.br',
        notes: 'Depósito legal e registro na Fundação Biblioteca Nacional.',
        completed: true,
        position: 7,
      },
    ]

    const checklistCount = app.countRecords('checklist_items')
    if (checklistCount === 0) {
      for (const item of platforms) {
        const rec = new Record(checklistCol)
        rec.set('book_id', book.id)
        rec.set('platform', item.platform)
        rec.set('platform_key', item.platform_key)
        rec.set('link', item.link)
        rec.set('completed', item.completed)
        rec.set('notes', item.notes)
        rec.set('position', item.position)
        app.save(rec)
      }
    }
  },
  (app) => {
    // Revert seed if needed
  },
)
