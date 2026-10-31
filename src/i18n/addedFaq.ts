/** FAQ translations for the languages added after the original 25 (uk, bn, nb); order matches the source FAQ list. */
export const ADDED_FAQ: Record<string, Array<{ q: string; a: string }>> = {
  "uk": [
    {
      "q": "Як працює генератор імен на кшталт NameForge?",
      "a": "NameForge поєднує лінгвістичні корені, гармонійні склади та правила морфології, підібрані для кожного всесвіту (фентезі, технології, брендинг, оповідь). На відміну від простих випадкових генераторів, його рушій враховує ритм, вимову й тематичну доречність."
    },
    {
      "q": "Як обрати ім’я, що справді пасує моєму проєкту?",
      "a": "Спершу визначте бажаний тон (престижний, різкий, таємничий чи дружній). Вимовте ім’я вголос, щоб перевірити його. Переконайтеся, що довжина відповідає призначенню: коротке для мобільного застосунку чи виразніше для серії книжок."
    },
    {
      "q": "Як створити оригінальне й запам’ятовуване ім’я?",
      "a": "Пробуйте несподівані поєднання складів або тонкі слова-гібриди. Уникайте заяложених кліше та зайвих цифр. Оберіть «Коротка» для різких імен і «Середня» для збалансованого результату."
    },
    {
      "q": "Як уникнути схожих імен у різних генераціях?",
      "a": "NameForge зберігає локальну ковзну пам’ять про 100 останніх згенерованих імен. Під час наступних генерацій нещодавні пропозиції відфільтровуються, щоб результати були свіжішими та різноманітнішими."
    },
    {
      "q": "Чи можна генерувати імена різними мовами та звучаннями?",
      "a": "Так. Кожен генератор має вибір мови генерації (українська, англійська, японська/аніме, арабська/східна, латинська/ельфійська, нордична й технічна тощо). Це змінює фонетичні корені, не змінюючи мову інтерфейсу сайту."
    },
    {
      "q": "Як працюють налаштування стилю та довжини?",
      "a": "Довжина впливає на структуру імені: «Коротка» зазвичай дає один-два виразні склади, «Середня» — два-три збалансовані, а «Довга» віддає перевагу складеним чи розповідним іменам. Стиль коригує домінантні звуки й задуманий архетип."
    },
    {
      "q": "Як копіювати, зберігати та знову знаходити свої імена?",
      "a": "Кожна картка імені має кнопку «Копіювати» в один клік, кнопку «Зберегти» для улюблених і кнопку «Подобається». Знайдіть вибрані імена в розділі «Мої імена» на панелі навігації."
    },
    {
      "q": "Як працюють улюблені, добірки та приватні нотатки?",
      "a": "У розділі «Мої імена» створюйте тематичні добірки, щоб групувати імена за проєктами. До окремих імен можна додавати приватні нотатки, щоб запам’ятати ідею чи задуману роль."
    },
    {
      "q": "Як обчислюються зірки та рейтинги найкращих імен?",
      "a": "Кожну пропозицію можна оцінити від однієї до п’яти зірок. Список найкращих імен показує ваші найвище оцінені творіння в цьому просторі без вигаданих голосів."
    },
    {
      "q": "Чи можна експортувати або імпортувати списки імен?",
      "a": "Так. У розділі «Мої імена» експортуйте збережене як JSON (з нотатками й добірками) або CSV для таблиць. Також можна безпечно відновити попередню резервну копію JSON."
    },
    {
      "q": "Чи зберігаються мої особисті дані на моєму пристрої?",
      "a": "NameForge працює локально: обліковий запис і пароль не потрібні. Ваші збережені імена, нотатки та налаштування залишаються у сховищі браузера."
    },
    {
      "q": "Чи гарантовано, що згенеровані імена унікальні у світі?",
      "a": "Рушій поєднує багато коренів, щоб створювати широкий спектр рідкісних комбінацій. Проте жоден алгоритм не може гарантувати абсолютну світову унікальність; ім’я може випадково вже існувати в іншій мові."
    },
    {
      "q": "Чи можна використати згенероване ім’я для моєї компанії чи продукту?",
      "a": "Пропозиції надаються безкоштовно для творчого використання. Перш ніж використовувати ім’я комерційно, перевірте відповідні реєстри торгових марок для вашої галузі та юрисдикції, як-от EUIPO чи USPTO."
    },
    {
      "q": "Як перевірити, чи доступний інтернет-домен?",
      "a": "Введіть обране ім’я в реєстратора доменів, щоб дізнатися, чи доступні для реєстрації розширення, як-от .com, .ua чи .io."
    },
    {
      "q": "Чи слід перевіряти зареєстровані торгові марки перед використанням імені?",
      "a": "Так. Це необхідно, перш ніж інвестувати в брендинг, логотип чи реєстрацію компанії. NameForge не засвідчує правову доступність; він дарує натхнення."
    },
    {
      "q": "Чи працює сайт на телефонах і планшетах?",
      "a": "Так. Адаптивний інтерфейс створено для смартфонів, планшетів і настільних екранів."
    },
    {
      "q": "Що робити, якщо мені не подобається результат?",
      "a": "Натисніть «Викувати нові імена» або клавішу G на клавіатурі. Також можна змінити архетип, довжину чи мову генерації, щоб дослідити інше звучання."
    },
    {
      "q": "Як повідомити про проблему чи запропонувати покращення?",
      "a": "Діліться пропозиціями через репозиторій проєкту або пропонуйте нові архетипи для майбутніх версій."
    }
  ],
  "bn": [
    {
      "q": "NameForge-এর মতো একটি নাম জেনারেটর কীভাবে কাজ করে?",
      "a": "NameForge প্রতিটি জগতের (ফ্যান্টাসি, প্রযুক্তি, ব্র্যান্ডিং ও গল্পকথা) উপযোগী ভাষাগত মূল, সুরেলা সিলেবল ও রূপতত্ত্বের নিয়ম একত্র করে। সাধারণ এলোমেলো জেনারেটরের বিপরীতে এর নামকরণ ইঞ্জিন ছন্দ, উচ্চারণ ও বিষয়গত প্রাসঙ্গিকতা বিবেচনা করে।"
    },
    {
      "q": "আমার প্রকল্পের সঙ্গে সত্যিই মানানসই নাম কীভাবে বাছব?",
      "a": "প্রথমে কাঙ্ক্ষিত সুর ঠিক করুন (মর্যাদাপূর্ণ, ধারালো, রহস্যময় বা বন্ধুত্বপূর্ণ)। নামটি জোরে উচ্চারণ করে পরীক্ষা করুন। দৈর্ঘ্য যেন ব্যবহারের সঙ্গে মানায়: মোবাইল অ্যাপের জন্য ছোট, বইয়ের সিরিজের জন্য আরও ব্যঞ্জনাময়।"
    },
    {
      "q": "মৌলিক ও স্মরণীয় নাম কীভাবে তৈরি করব?",
      "a": "অপ্রত্যাশিত সিলেবল-সমন্বয় বা সূক্ষ্ম মিশ্র শব্দ চেষ্টা করুন। ক্লিশে ও অপ্রয়োজনীয় সংখ্যা এড়িয়ে চলুন। ধারালো নামের জন্য ‘ছোট’ এবং ভারসাম্যপূর্ণ ফলাফলের জন্য ‘মাঝারি’ বেছে নিন।"
    },
    {
      "q": "বিভিন্ন ব্যাচে একই ধরনের নাম কীভাবে এড়াব?",
      "a": "NameForge সাম্প্রতিক ১০০টি তৈরি করা নামের একটি স্থানীয় স্লাইডিং স্মৃতি রাখে। পরবর্তী ব্যাচে সাম্প্রতিক প্রস্তাব বাদ দেওয়া হয়, ফলে ফলাফল আরও তাজা ও বৈচিত্র্যময় হয়।"
    },
    {
      "q": "বিভিন্ন ভাষা ও ধ্বনির নাম কি তৈরি করা যায়?",
      "a": "হ্যাঁ। প্রতিটি জেনারেটরে একটি তৈরির ভাষা বাছাইয়ের সুবিধা আছে (বাংলা, ইংরেজি, জাপানি/অ্যানিমে, আরবি/প্রাচ্য, ল্যাটিন/এলফ, নর্ডিক ও টেক ইত্যাদি)। এটি ওয়েবসাইটের ইন্টারফেস ভাষা না বদলেই ধ্বনিগত মূল বদলায়।"
    },
    {
      "q": "স্টাইল ও দৈর্ঘ্যের সেটিং কীভাবে কাজ করে?",
      "a": "দৈর্ঘ্য নামের কাঠামো প্রভাবিত করে: ‘ছোট’ সাধারণত এক-দুটি ধারালো সিলেবল, ‘মাঝারি’ দুই-তিনটি ভারসাম্যপূর্ণ সিলেবল দেয়, আর ‘লম্বা’ যৌগিক বা বর্ণনামূলক নামকে প্রাধান্য দেয়। স্টাইল প্রধান ধ্বনি ও উদ্দিষ্ট আর্কিটাইপ ঠিক করে।"
    },
    {
      "q": "নাম কীভাবে কপি, সংরক্ষণ ও আবার খুঁজে পাব?",
      "a": "প্রতিটি নামের কার্ডে এক-ক্লিকের কপি বোতাম, প্রিয় সংরক্ষণের বোতাম ও পছন্দ বোতাম আছে। নেভিগেশন বার থেকে ‘আমার নামগুলো’-তে বাছাই করা নাম খুঁজে নিন।"
    },
    {
      "q": "প্রিয়, সংগ্রহ ও ব্যক্তিগত নোট কীভাবে কাজ করে?",
      "a": "‘আমার নামগুলো’-তে প্রকল্প অনুযায়ী নাম গুছিয়ে রাখতে থিমভিত্তিক সংগ্রহ তৈরি করুন। কোনো ধারণা বা উদ্দিষ্ট ভূমিকা মনে রাখতে আলাদা নামে ব্যক্তিগত নোটও যোগ করতে পারেন।"
    },
    {
      "q": "তারা ও সেরা নামের র‍্যাঙ্কিং কীভাবে হিসাব করা হয়?",
      "a": "প্রতিটি প্রস্তাবকে এক থেকে পাঁচ তারা দিতে পারেন। সেরা নামের তালিকা কোনো ভুয়া ভোট ছাড়াই এই কর্মক্ষেত্রে আপনার সর্বোচ্চ রেটিংপ্রাপ্ত সৃষ্টিগুলো তুলে ধরে।"
    },
    {
      "q": "আমার নামের তালিকা কি রপ্তানি বা আমদানি করা যায়?",
      "a": "হ্যাঁ। ‘আমার নামগুলো’-তে সংরক্ষিত তথ্য JSON (নোট ও সংগ্রহসহ) বা স্প্রেডশিটের জন্য CSV হিসেবে রপ্তানি করুন। আগের JSON ব্যাকআপও নিরাপদে পুনরুদ্ধার করা যায়।"
    },
    {
      "q": "আমার ব্যক্তিগত তথ্য কি আমার ডিভাইসেই থাকে?",
      "a": "NameForge স্থানীয়ভাবে কাজ করে: কোনো ব্যবহারকারী অ্যাকাউন্ট বা পাসওয়ার্ড লাগে না। আপনার সংরক্ষিত নাম, নোট ও পছন্দ ব্রাউজারের স্টোরেজেই থাকে।"
    },
    {
      "q": "তৈরি করা নামগুলো কি বিশ্বজুড়ে অনন্য হওয়ার নিশ্চয়তা আছে?",
      "a": "ইঞ্জিন অনেক মূল মিলিয়ে বিরল সমন্বয়ের বিস্তৃত পরিসর তৈরি করে। তবে কোনো অ্যালগরিদমই বিশ্বব্যাপী পরম অনন্যতার নিশ্চয়তা দিতে পারে না; কোনো নাম দৈবক্রমে অন্য ভাষায় আগেই থাকতে পারে।"
    },
    {
      "q": "তৈরি করা নাম কি আমার কোম্পানি বা পণ্যের জন্য ব্যবহার করা যায়?",
      "a": "প্রস্তাবগুলো সৃজনশীল ব্যবহারের জন্য রয়্যালটি-মুক্ত। বাণিজ্যিকভাবে ব্যবহারের আগে আপনার খাত ও এখতিয়ারের প্রাসঙ্গিক ট্রেডমার্ক নিবন্ধন, যেমন EUIPO বা USPTO, যাচাই করুন।"
    },
    {
      "q": "ইন্টারনেট ডোমেইন পাওয়া যাবে কি না তা কীভাবে যাচাই করব?",
      "a": "আপনার বেছে নেওয়া নামটি ডোমেইন রেজিস্ট্রারে লিখে দেখুন .com, .bd বা .io-র মতো এক্সটেনশন নিবন্ধনের জন্য পাওয়া যায় কি না।"
    },
    {
      "q": "নাম ব্যবহারের আগে কি নিবন্ধিত ট্রেডমার্ক যাচাই করা উচিত?",
      "a": "হ্যাঁ। ব্র্যান্ডিং, লোগো বা কোম্পানি নিবন্ধনে বিনিয়োগের আগে এটি অপরিহার্য। NameForge আইনি প্রাপ্যতার প্রত্যয়ন দেয় না; এটি অনুপ্রেরণা জোগায়।"
    },
    {
      "q": "ওয়েবসাইটটি কি ফোন ও ট্যাবলেটে কাজ করে?",
      "a": "হ্যাঁ। রেসপনসিভ ইন্টারফেসটি স্মার্টফোন, ট্যাবলেট ও ডেস্কটপ স্ক্রিনে ব্যবহারের জন্য তৈরি।"
    },
    {
      "q": "কোনো ফলাফল পছন্দ না হলে কী করব?",
      "a": "‘নতুন নাম গড়ুন’ বোতাম বা কিবোর্ডে G চাপুন। ভিন্ন ধ্বনি অন্বেষণ করতে আর্কিটাইপ, দৈর্ঘ্য বা তৈরির ভাষাও বদলাতে পারেন।"
    },
    {
      "q": "সমস্যা জানাতে বা উন্নতির পরামর্শ দিতে কী করব?",
      "a": "প্রকল্পের রিপোজিটরির মাধ্যমে পরামর্শ জানাতে পারেন অথবা ভবিষ্যৎ সংস্করণের জন্য নতুন আর্কিটাইপ প্রস্তাব করতে পারেন।"
    }
  ],
  "nb": [
    {
      "q": "Hvordan fungerer en navnegenerator som NameForge?",
      "a": "NameForge kombinerer språklige røtter, harmoniske staver og morfologiregler tilpasset hvert univers (fantasy, teknologi, merkevarebygging og historiefortelling). I motsetning til enkle tilfeldighetsgeneratorer tar navnemotoren hensyn til rytme, uttale og tematisk relevans."
    },
    {
      "q": "Hvordan velger jeg et navn som virkelig passer prosjektet mitt?",
      "a": "Bestem først tonen du vil ha (prestisjefylt, skarp, mystisk eller vennlig). Si navnet høyt for å teste det. Sørg for at lengden passer bruken: kort for en mobilapp, eller mer stemningsfull for en bokserie."
    },
    {
      "q": "Hvordan lager jeg et originalt og minneverdig navn?",
      "a": "Prøv uventede stavekombinasjoner eller subtile sammensmeltinger. Unngå utslitte klisjeer og unødvendige tall. Velg Kort for slagkraftige navn og Middels for et balansert resultat."
    },
    {
      "q": "Hvordan unngår jeg lignende navn på tvers av genereringer?",
      "a": "NameForge har et lokalt glidende minne over de 100 sist genererte navnene. Ved senere genereringer filtreres nylige forslag bort for å gi friskere og mer varierte resultater."
    },
    {
      "q": "Kan jeg generere navn med ulike språk og lyder?",
      "a": "Ja. Hver generator har en velger for genereringsspråk (norsk, engelsk, japansk/anime, arabisk/orientalsk, latin/alve, nordisk og teknologi osv.). Den endrer de fonetiske røttene uten å endre nettstedets grensesnittspråk."
    },
    {
      "q": "Hvordan fungerer stil- og lengdeinnstillingene?",
      "a": "Lengden påvirker navnestrukturen: Kort gir vanligvis én eller to slagkraftige staver, Middels sikter mot to eller tre balanserte staver, og Lang favoriserer sammensatte eller fortellende navn. Stilen justerer de dominerende lydene og den tiltenkte arketypen."
    },
    {
      "q": "Hvordan kopierer, lagrer og finner jeg navnene mine igjen?",
      "a": "Hvert navnekort har en Kopier-knapp med ett klikk, en Lagre-knapp for favoritter og en Lik-knapp. Finn de valgte navnene i Mine navn fra navigasjonslinjen."
    },
    {
      "q": "Hvordan fungerer favoritter, samlinger og private notater?",
      "a": "I Mine navn kan du opprette tematiske samlinger for å gruppere navn etter prosjekt. Du kan også legge til private notater på enkeltnavn for å huske en idé eller en tiltenkt rolle."
    },
    {
      "q": "Hvordan beregnes stjerner og rangeringer av de beste navnene?",
      "a": "Du kan vurdere hvert forslag fra én til fem stjerner. Topplisten fremhever dine høyest vurderte skapelser i dette arbeidsområdet uten å dikte opp stemmer."
    },
    {
      "q": "Kan jeg eksportere eller importere navnelistene mine?",
      "a": "Ja. I Mine navn kan du eksportere lagrede elementer som JSON (inkludert notater og samlinger) eller CSV for regneark. Du kan også trygt gjenopprette en tidligere JSON-sikkerhetskopi."
    },
    {
      "q": "Lagres personopplysningene mine på enheten min?",
      "a": "NameForge fungerer lokalt: Ingen brukerkonto eller passord kreves. Lagrede navn, notater og innstillinger blir værende i nettleserens lagring."
    },
    {
      "q": "Er genererte navn garantert unike i hele verden?",
      "a": "Motoren kombinerer mange røtter for å gi et bredt utvalg uvanlige kombinasjoner. Likevel kan ingen algoritme garantere absolutt unikhet i hele verden; et navn kan tilfeldigvis allerede finnes på et annet språk."
    },
    {
      "q": "Kan jeg bruke et generert navn til selskapet eller produktet mitt?",
      "a": "Forslagene leveres royaltyfritt for kreativ bruk. Før du bruker et navn kommersielt, bør du sjekke relevante varemerkeregistre for din bransje og jurisdiksjon, for eksempel EUIPO eller USPTO."
    },
    {
      "q": "Hvordan sjekker jeg om et internettdomene er ledig?",
      "a": "Skriv inn det valgte navnet hos en domeneregistrator for å se om endelser som .com, .no eller .io er ledige for registrering."
    },
    {
      "q": "Bør jeg sjekke registrerte varemerker før jeg bruker et navn?",
      "a": "Ja. Dette er avgjørende før du investerer i merkevarebygging, logo eller selskapsregistrering. NameForge bekrefter ikke juridisk tilgjengelighet; det gir inspirasjon."
    },
    {
      "q": "Fungerer nettstedet på telefoner og nettbrett?",
      "a": "Ja. Det responsive grensesnittet er laget for bruk på smarttelefoner, nettbrett og stasjonære skjermer."
    },
    {
      "q": "Hva om jeg ikke liker et resultat?",
      "a": "Velg Smi nye navn eller trykk G på tastaturet. Du kan også endre arketype, lengde eller genereringsspråk for å utforske en annen klang."
    },
    {
      "q": "Hvordan kan jeg rapportere et problem eller foreslå en forbedring?",
      "a": "Del forslag via prosjektets repositorium eller foreslå nye arketyper som kan vurderes i fremtidige versjoner."
    }
  ]
};
