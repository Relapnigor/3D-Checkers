# Warcaby 3D

*[🇬🇧 English version of README](README.md)*

Wieloosobowa gra w warcaby w czasie rzeczywistym, renderowana w 3D przy pomocy Three.js, z niewielkim backendem Node/Express, który łączy dwóch graczy w parę i pozwala dowolnej liczbie obserwatorów oglądać rozgrywkę.

## Funkcje

- Plansza i pionki renderowane w 3D przez Three.js, ruch przez kliknięcie pionka, a potem docelowego pola
- Legalne ruchy (w tym bicia) dla zaznaczonego pionka są podświetlane na planszy przed wykonaniem ruchu
- Bicia: przeskoczenie sąsiedniego pionka przeciwnika usuwa go, u obu graczy, w czasie rzeczywistym
- Synchronizacja w czasie rzeczywistym przez Socket.IO — ruchy i bicia przeciwnika pojawiają się na Twojej planszy natychmiast, bez odświeżania czy odpytywania
- 30-sekundowy limit czasu na ruch przeciwnika; jeśli go nie zdąży wykonać, wygrywasz walkowerem
- Płynna animacja ruchu (przez @tweenjs/tween.js)
- Dwóch graczy na partię (biały i czarny), przypisywani automatycznie jako pierwsze dwie zalogowane osoby
- Dowolna liczba obserwatorów może dołączyć później i oglądać z widoku z boku
- Prosty ekran logowania po nazwie; partia startuje, gdy obecni są obaj gracze, a drugi z nich potwierdzi gotowość

## Stack technologiczny

- **Backend:** Node.js, [Express](https://expressjs.com/), [Socket.IO](https://socket.io/) do przesyłania ruchów/bić/walkowerów między graczami w czasie rzeczywistym
- **Frontend:** czysty JavaScript, [Three.js](https://threejs.org/) do renderowania 3D, [@tweenjs/tween.js](https://github.com/tweenjs/tween.js) do animacji ruchu, klient Socket.IO (wczytywany z CDN) — bez frameworka, bez procesu budowania
- Czysty HTML/CSS

## Struktura projektu

```
.
├── server.js                   # serwer Express: przypisuje miejsca graczy/obserwatorów, sygnalizuje start gry
├── package.json
└── static/
    ├── index.html                 # szkielet strony, ładuje poniższe skrypty
    ├── css/
    │   └── style.css                # style ekranu logowania
    ├── img/                           # tekstury pionków i pól
    ├── js/
    │   ├── Main.js                      # punkt wejścia: tworzy Game/Net, podpina logowanie + zdarzenia Socket.IO (ruch/bicie/walkower)
    │   ├── Ui.js                         # buduje DOM ekranu logowania
    │   ├── Net.js                         # komunikacja z serwerem przez zwykłe HTTP: rejestracja gracza, odpytywanie o start gry
    │   └── Game.js                         # scena 3D: plansza, pionki, kamera, podświetlanie legalnych ruchów, bicia, animacja ruchu
    ├── libs/
    │   └── tween.umd.js                     # dołączona kopia @tweenjs/tween.js — nietknięta, to nie jest kod tego projektu
    └── three/
        └── three145.js                        # dołączona kopia three.js (r145) — nietknięta, to nie jest kod tego projektu
```

## Uruchomienie lokalnie

```bash
npm install
npm start
```

Następnie otwórz `http://localhost:3000` w dwóch kartach przeglądarki (albo dwóch różnych przeglądarkach/urządzeniach w tej samej sieci), żeby zagrać obiema stronami, i otwórz w kolejnych kartach, żeby oglądać jako obserwator.

## Jak grać

1. Podaj nazwę i zaloguj się. Pierwsza osoba zostaje białym, druga czarnym.
2. Gdy połączy się trzecia osoba (choćby jako obserwator), ekran drugiego gracza pozwoli potwierdzić, że partia jest gotowa do startu.
3. W swojej turze kliknij jeden ze swoich pionków — jego legalne ruchy podświetlą się na planszy — a następnie kliknij jedno z podświetlonych pól, żeby się tam przesunąć (ruch o dwa pola zbija pionek znajdujący się pomiędzy).
4. W trakcie tury przeciwnika widoczny jest 30-sekundowy licznik; jeśli nie zdąży wykonać ruchu, automatycznie wygrywasz.

## Uwagi

- Komentarze w kodzie są po angielsku; część tekstów widocznych dla użytkownika (alerty, linijka logu startowego serwera) pozostała po polsku, bo tłumaczone były tylko komentarze, nie tekst interfejsu.
- `static/libs/tween.umd.js` i `static/three/three145.js` to biblioteki zewnętrzne dołączone bezpośrednio do repozytorium, a nie zainstalowane jako właściwe zależności — wymieniłem je powyżej dla kompletności struktury, ale nie zostały w żaden sposób zmienione ani udokumentowane w ramach tej pracy, bo to nie jest kod tego projektu.
