# Teambuildingový kvíz

Jednoduchá webová aplikace pro moderátora a hráče. Data se drží v paměti serveru, takže je určena pro jednu živou hru.

## Online nasazení

Balíček obsahuje i `render.yaml`, takže ho lze nasadit jako Node webovou službu na Renderu. Render umí připojit GitHub repozitář a aplikaci spustit příkazem `npm start`; po nasazení vznikne veřejná adresa `onrender.com`.

## Spuštění

```bash
cd quiz-app
npm start
```

Moderátor otevře:

```text
http://localhost:3000/?mode=host
```

Hráči otevřou adresu zobrazenou na obrazovce s doplněním `?mode=player`. Pokud jsou mobily na stejné Wi‑Fi jako notebook, použijí místo `localhost` lokální IP adresu notebooku, například `http://192.168.1.25:3000/?mode=player`.

Otázky jsou v souboru `questions.json`. U každé otázky lze změnit text, možnosti a index správné odpovědi (`0` až `3`).

## Průběh hry

1. Moderátor vytvoří místnost.
2. Hráči zadají kód, jméno a tým.
3. Moderátor spustí hru.
4. Po odpovědích uzavře otázku a zobrazí výsledky.
5. Tlačítkem „Další otázka“ pokračuje až do konečného pořadí.
