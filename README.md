# 🎲 Solitaire Dice (Sid Sackson)

Tämä on selainpohjainen toteutus Sid Sacksonin klassisesta yksinpelistä **Solitaire Dice**.  
Peli toimii sekä puhelimella että PC:llä, ja sitä voi kokeilla suoraan selaimessa.

---

## 📖 Säännöt lyhyesti
- Heitä viisi noppaa.  
- Yksi noppa hylätään → lopuista muodostetaan kaksi paria.  
- Pari vastaa summaa (2–12), ja kyseisen radan merkintää siirretään eteenpäin.  
- Alussa radat antavat −200 pistettä, kunnes saat ne nollattua.  
- Kun rataa jatkaa pidemmälle, alkaa kertyä positiivisia pisteitä taulukon mukaan.  
- Peli loppuu, kun jokin hylätty numero saavuttaa 8 merkintää.  
- Tavoitteena on saada mahdollisimman korkea pistemäärä (virallinen “voitto” = yli 500 pistettä).

---

## 💻 Käyttö
1. Avaa [GitHub Pages -sivu](https://käyttäjä.github.io/repo)  
   *(vaihda osoite oman repoosi)*  
2. Tai aja lokaalisti:
   ```bash
   # kloonaa repo
   git clone https://github.com/käyttäjä/repo.git
   cd repo
   # käynnistä paikallinen http-palvelin
   python -m http.server 8000
   # avaa selaimessa
   http://localhost:8000/
   ```

---

## ⚙️ Parametrit (pelin vaikeustaso)

Pelin logiikassa on parametrisoitu **NEG_STEPS** (montako negatiivista merkintää radalla ennen nollaa):

- `NEG_STEPS = 4` → **Alkuperäinen** sääntö  
  (1–4 merkkiä = −200, 5.=0, 6.–10.=+arvoa, max 5×)  
- `NEG_STEPS = 3` → **Helpompi** sääntö  
  (1–3 merkkiä = −200, 4.=0, 5.–10.=+arvoa, max 6×)

Voit vaihtaa suoraan `app.js`-tiedoston alussa:

```js
let NEG_STEPS = 3; // helpompi
// tai
let NEG_STEPS = 4; // alkuperäinen
```

---

## 🛠️ Tekninen toteutus
- **HTML5 + CSS + JavaScript**
- Ei riippuvuuksia, toimii suoraan selaimessa
- UI mukautuu puhelimelle ja PC:lle
- Tapahtumien bindaukset hoidetaan `init()`-funktion sisällä → ei ajoitusvirheitä
- Mukana pieni shim, joka varmistaa ettei peli kaadu vaikka elementti puuttuisi

---

## 📜 Lähteet
- Sid Sackson: *A Gamut of Games* (1971)  
- [BoardGameGeek: Solitaire Dice](https://boardgamegeek.com/boardgame/10804/solitaire-dice)

---

## 📄 Lisenssi
Lisää oma lisenssivalintasi tähän, esim. MIT:

```
MIT License
Copyright (c) ...
```
