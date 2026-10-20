// @ts-nocheck
// The scripted conversations of the home-page demo (L4, D1). The region from `var SCEN` to `function scenOf` is the text of the
// mock's assets/mock-api.js WORD FOR WORD, in the same quotes and the same spacing (card L4 §4, item 9: the check reads quoted runs
// of 12+ characters out of the mock and looks for each in src/app/pages/home/**): do not reformat it, do not reword it. The mock's
// shape (var, 2-space indent inside the old closure) is kept on purpose. This file lazy-loads with the demo chunk only; the labels
// of the tabs and languages the prerender draws live in demo-labels.ts (F18) and never import this file.
//
// No window, no document, no Angular here: the file is imported by Node tests (home-demo-contract) as well as by the browser.

import { nextDow } from './next-dow';

var SCEN = {
    salon: {
      tab: 'Salon', brand: 'Glow Studio', tagline: 'Book by chatting', kind: 'Beauty salon',
      welcome: 'Hi! What would you like to book?',
      phrase: 'balayage and a trim next tuesday morning, long hair',
      extracted: { service: 'balayage + haircut', hairLength: 'long', preferredDate: nextDow(2), timeWindow: 'morning' },
      data: { service: 'Balayage + haircut', hair_length: 'Long', date: nextDow(2), time_window: 'Morning' },
      endpoint: 'GET /stylists', cardsField: 'stylist', cardsLabel: 'Stylist',
      results: [['Anna K.', 'Colour · Tue 09:30'], ['Marta L.', 'Colour · Tue 11:00'], ['Julia S.', 'Colour · Tue 10:15']],
      reply: 'Found 3 stylists for Tuesday morning. Who would you like?',
      fields: [['service', 'text', 'Service'], ['hair_length', 'text', 'Hair length'], ['date', 'date', 'Date'], ['time_window', 'text', 'Time of day']],
      say: 'Can I come in on Saturday at 2 pm?'
    },
    garage: {
      tab: 'Garage', brand: 'AutoPro Service', tagline: 'Book by chatting', kind: 'Car service',
      welcome: 'What service does your car need?',
      phrase: 'schedule MOT for my BMW X5, saturday afternoon if possible',
      extracted: { service: 'MOT', vehicleMake: 'BMW', vehicleModel: 'X5', date: nextDow(6), timeWindow: 'afternoon' },
      data: { service: 'MOT', vehicle: 'BMW X5', date: nextDow(6), time_window: 'Afternoon' },
      endpoint: 'GET /slots', cardsField: 'slot', cardsLabel: 'Time slot',
      results: [['Bay 2', 'MOT · Sat 13:00'], ['Bay 4', 'MOT · Sat 14:30'], ['Bay 1', 'MOT · Sat 16:00']],
      reply: 'Found 3 free slots on Saturday afternoon. Which one?',
      fields: [['service', 'text', 'Service'], ['vehicle', 'text', 'Vehicle'], ['date', 'date', 'Date'], ['time_window', 'text', 'Time of day']],
      say: 'Brake check for my Golf on Friday at 9'
    },
    table: {
      tab: 'Restaurant', brand: 'TastePlace', tagline: 'Book by chatting', kind: 'Restaurant',
      welcome: 'When would you like the table?',
      phrase: 'book a table for 4 friday 8pm, by the window please',
      extracted: { partySize: '4', date: nextDow(5), time: '20:00', seating: 'window' },
      data: { party_size: '4', date: nextDow(5), time: '20:00', seating: 'Window' },
      endpoint: 'GET /tables', cardsField: 'table', cardsLabel: 'Table',
      results: [['Window 2', 'Seats 4 · Fri 20:00'], ['Patio 5', 'Seats 4 · Fri 20:15'], ['Bar Hi-Top 1', 'Seats 4 · Fri 19:45']],
      reply: 'Three tables are free around 8 pm. Which one?',
      fields: [['party_size', 'text', 'Guests'], ['date', 'date', 'Date'], ['time', 'time', 'Time'], ['seating', 'text', 'Seating']],
      say: 'A table for two tomorrow at 7'
    },
    freight: {
      tab: 'Freight', brand: 'TransEdge Freight', tagline: 'Book by chatting', kind: 'Freight shipping',
      welcome: 'What are we shipping, and where?',
      phrase: 'two pallets from Gdańsk to Berlin, pickup monday morning',
      extracted: { cargo: 'pallet', quantity: '2', from: 'Gdańsk', to: 'Berlin', pickupDate: nextDow(1), timeWindow: 'morning' },
      data: { cargo: 'Pallet', quantity: '2', pickup_from: 'Gdańsk', pickup_to: 'Berlin', date: nextDow(1), time_window: 'Morning' },
      endpoint: 'GET /pickups', cardsField: 'slot', cardsLabel: 'Pickup',
      results: [['Truck 12', 'Mon 08:00 · Gdańsk'], ['Truck 7', 'Mon 09:30 · Gdańsk'], ['Truck 3', 'Mon 11:00 · Gdańsk']],
      reply: 'Three pickups are free on Monday morning. Which one?',
      fields: [['cargo', 'text', 'Cargo'], ['quantity', 'text', 'Quantity'], ['pickup_from', 'text', 'From'], ['pickup_to', 'text', 'To'], ['date', 'date', 'Pickup date'], ['time_window', 'text', 'Time of day']],
      say: 'Can you pick something up on Monday at 10?'
    }
  };


  /* Demo languages. The widget itself ships 25 interface languages; here the same four scenarios are scripted in four more.
     Everything the visitor sees in the chat (welcome, labels, replies, list of free times) is translated; keys stay the same. */
  var COMMON = {
    en: { tagline: 'Book by chatting', name: 'Name', phone: 'Phone', contact: 'Kasia, +48 500 100 200', who: 'Kasia', tel: '+48 500 100 200',
      ask: 'Great. What is your name and phone number?', review: 'Thanks! Please review your request.',
      confirmation: 'Please review your request.', success: 'Your request was sent.', error: 'Something went wrong.', button: 'Send request' },
    pl: { tagline: 'Rezerwuj w rozmowie', name: 'Imię', phone: 'Telefon', contact: 'Kasia, +48 500 100 200', who: 'Kasia', tel: '+48 500 100 200',
      ask: 'Świetnie. Jak masz na imię i jaki jest twój numer telefonu?', review: 'Dziękuję! Sprawdź, proszę, swoje zgłoszenie.',
      confirmation: 'Sprawdź, proszę, swoje zgłoszenie.', success: 'Zgłoszenie zostało wysłane.', error: 'Coś poszło nie tak.', button: 'Wyślij zgłoszenie' },
    de: { tagline: 'Per Chat buchen', name: 'Name', phone: 'Telefon', contact: 'Katrin, +49 151 10020030', who: 'Katrin', tel: '+49 151 10020030',
      ask: 'Sehr gern. Wie heißen Sie, und wie lautet Ihre Telefonnummer?', review: 'Danke! Bitte prüfen Sie Ihre Anfrage.',
      confirmation: 'Bitte prüfen Sie Ihre Anfrage.', success: 'Ihre Anfrage wurde gesendet.', error: 'Etwas ist schiefgelaufen.', button: 'Anfrage senden' },
    ru: { tagline: 'Бронирование в чате', name: 'Имя', phone: 'Телефон', contact: 'Катя, +48 500 100 200', who: 'Катя', tel: '+48 500 100 200',
      ask: 'Отлично. Как вас зовут и какой у вас номер телефона?', review: 'Спасибо! Проверьте, пожалуйста, заявку.',
      confirmation: 'Проверьте, пожалуйста, заявку.', success: 'Заявка отправлена.', error: 'Что-то пошло не так.', button: 'Отправить заявку' },
    es: { tagline: 'Reserva chateando', name: 'Nombre', phone: 'Teléfono', contact: 'Lucía, +34 600 100 200', who: 'Lucía', tel: '+34 600 100 200',
      ask: 'Perfecto. ¿Cómo te llamas y cuál es tu teléfono?', review: '¡Gracias! Revisa tu solicitud.',
      confirmation: 'Revisa tu solicitud.', success: 'Tu solicitud se ha enviado.', error: 'Algo ha ido mal.', button: 'Enviar solicitud' }
  };
  var F = function (a) { return a.map(function (x) { return [x[0], x[1], x[2]]; }); };
  var LANG = {
    pl: {
      salon: { welcome: 'Cześć! Na co chcesz się umówić?', phrase: 'balayage i podcięcie w przyszły wtorek rano, długie włosy',
        data: { service: 'Balayage + strzyżenie', hair_length: 'Długie', date: 'D2', time_window: 'Rano' },
        cardsLabel: 'Fryzjerka', results: [['Anna K.', 'Koloryzacja · wt 09:30'], ['Marta L.', 'Koloryzacja · wt 11:00'], ['Julia S.', 'Koloryzacja · wt 10:15']],
        reply: 'Na wtorek rano są wolne 3 fryzjerki. Którą wybierasz?',
        fields: [['service', 'text', 'Usługa'], ['hair_length', 'text', 'Długość włosów'], ['date', 'date', 'Data'], ['time_window', 'text', 'Pora dnia']],
        say: 'Czy mogę przyjść w sobotę o 14:00?' },
      garage: { welcome: 'Jakiej usługi potrzebuje twój samochód?', phrase: 'umów mnie na przegląd techniczny BMW X5, w sobotę po południu, jeśli się da',
        data: { service: 'Przegląd techniczny', vehicle: 'BMW X5', date: 'D6', time_window: 'Po południu' },
        cardsLabel: 'Termin', results: [['Stanowisko 2', 'Przegląd · sob 13:00'], ['Stanowisko 4', 'Przegląd · sob 14:30'], ['Stanowisko 1', 'Przegląd · sob 16:00']],
        reply: 'W sobotę po południu są 3 wolne terminy. Który wybierasz?',
        fields: [['service', 'text', 'Usługa'], ['vehicle', 'text', 'Pojazd'], ['date', 'date', 'Data'], ['time_window', 'text', 'Pora dnia']],
        say: 'Kontrola hamulców w Golfie, w piątek o 9:00' },
      table: { welcome: 'Na kiedy chcesz stolik?', phrase: 'zarezerwuj stolik dla 4 osób w piątek o 20:00, przy oknie, proszę',
        data: { party_size: '4', date: 'D5', time: '20:00', seating: 'Przy oknie' },
        cardsLabel: 'Stolik', results: [['Przy oknie 2', '4 os. · pt 20:00'], ['Ogródek 5', '4 os. · pt 20:15'], ['Bar 1', '4 os. · pt 19:45']],
        reply: 'Około 20:00 są wolne trzy stoliki. Który wybierasz?',
        fields: [['party_size', 'text', 'Liczba gości'], ['date', 'date', 'Data'], ['time', 'time', 'Godzina'], ['seating', 'text', 'Miejsce']],
        say: 'Stolik dla dwóch osób jutro na 19:00' },
      freight: { welcome: 'Co wysyłamy i dokąd?', phrase: 'dwie palety z Gdańska do Berlina, odbiór w poniedziałek rano',
        data: { cargo: 'Paleta', quantity: '2', pickup_from: 'Gdańsk', pickup_to: 'Berlin', date: 'D1', time_window: 'Rano' },
        cardsLabel: 'Odbiór', results: [['Pojazd 12', 'pon 08:00 · Gdańsk'], ['Pojazd 7', 'pon 09:30 · Gdańsk'], ['Pojazd 3', 'pon 11:00 · Gdańsk']],
        reply: 'W poniedziałek rano są trzy wolne terminy odbioru. Który wybierasz?',
        fields: [['cargo', 'text', 'Ładunek'], ['quantity', 'text', 'Liczba'], ['pickup_from', 'text', 'Skąd'], ['pickup_to', 'text', 'Dokąd'], ['date', 'date', 'Data odbioru'], ['time_window', 'text', 'Pora dnia']],
        say: 'Czy możecie odebrać coś w poniedziałek o 10:00?' }
    },
    de: {
      salon: { welcome: 'Hallo! Was möchten Sie buchen?', phrase: 'Balayage und Spitzen schneiden, nächsten Dienstag vormittags, lange Haare',
        data: { service: 'Balayage + Haarschnitt', hair_length: 'Lang', date: 'D2', time_window: 'Vormittag' },
        cardsLabel: 'Stylistin', results: [['Anna K.', 'Coloration · Di 09:30'], ['Marta L.', 'Coloration · Di 11:00'], ['Julia S.', 'Coloration · Di 10:15']],
        reply: 'Für Dienstagvormittag sind 3 Stylistinnen frei. Wen möchten Sie?',
        fields: [['service', 'text', 'Leistung'], ['hair_length', 'text', 'Haarlänge'], ['date', 'date', 'Datum'], ['time_window', 'text', 'Tageszeit']],
        say: 'Kann ich am Samstag um 14 Uhr kommen?' },
      garage: { welcome: 'Welchen Service braucht Ihr Auto?', phrase: 'Termin für die Hauptuntersuchung meines BMW X5, am liebsten Samstagnachmittag',
        data: { service: 'Hauptuntersuchung', vehicle: 'BMW X5', date: 'D6', time_window: 'Nachmittag' },
        cardsLabel: 'Termin', results: [['Hebebühne 2', 'HU · Sa 13:00'], ['Hebebühne 4', 'HU · Sa 14:30'], ['Hebebühne 1', 'HU · Sa 16:00']],
        reply: 'Für Samstagnachmittag sind 3 Termine frei. Welchen möchten Sie?',
        fields: [['service', 'text', 'Leistung'], ['vehicle', 'text', 'Fahrzeug'], ['date', 'date', 'Datum'], ['time_window', 'text', 'Tageszeit']],
        say: 'Bremsencheck für meinen Golf, Freitag um 9 Uhr' },
      table: { welcome: 'Für wann möchten Sie einen Tisch?', phrase: 'Einen Tisch für 4 Personen am Freitag um 20 Uhr, bitte am Fenster',
        data: { party_size: '4', date: 'D5', time: '20:00', seating: 'Am Fenster' },
        cardsLabel: 'Tisch', results: [['Fensterplatz 2', '4 Plätze · Fr 20:00'], ['Terrasse 5', '4 Plätze · Fr 20:15'], ['Bar 1', '4 Plätze · Fr 19:45']],
        reply: 'Gegen 20 Uhr sind drei Tische frei. Welchen möchten Sie?',
        fields: [['party_size', 'text', 'Personen'], ['date', 'date', 'Datum'], ['time', 'time', 'Uhrzeit'], ['seating', 'text', 'Sitzplatz']],
        say: 'Einen Tisch für zwei, morgen um 19 Uhr' },
      freight: { welcome: 'Was möchten Sie versenden, und wohin?', phrase: 'zwei Paletten von Danzig nach Berlin, Abholung Montagvormittag',
        data: { cargo: 'Palette', quantity: '2', pickup_from: 'Danzig', pickup_to: 'Berlin', date: 'D1', time_window: 'Vormittag' },
        cardsLabel: 'Abholtermin', results: [['LKW 12', 'Mo 08:00 · Danzig'], ['LKW 7', 'Mo 09:30 · Danzig'], ['LKW 3', 'Mo 11:00 · Danzig']],
        reply: 'Am Montagvormittag sind drei Abholtermine frei. Welchen möchten Sie?',
        fields: [['cargo', 'text', 'Ladung'], ['quantity', 'text', 'Anzahl'], ['pickup_from', 'text', 'Von'], ['pickup_to', 'text', 'Nach'], ['date', 'date', 'Abholdatum'], ['time_window', 'text', 'Tageszeit']],
        say: 'Können Sie am Montag um 10 Uhr etwas abholen?' }
    },
    ru: {
      salon: { welcome: 'Здравствуйте! На что хотите записаться?', phrase: 'балаяж и стрижка в следующий вторник утром, длинные волосы',
        data: { service: 'Балаяж + стрижка', hair_length: 'Длинные', date: 'D2', time_window: 'Утро' },
        cardsLabel: 'Мастер', results: [['Анна К.', 'Окрашивание · вт 09:30'], ['Марта Л.', 'Окрашивание · вт 11:00'], ['Юлия С.', 'Окрашивание · вт 10:15']],
        reply: 'На вторник утром свободны 3 мастера. Кого выберете?',
        fields: [['service', 'text', 'Услуга'], ['hair_length', 'text', 'Длина волос'], ['date', 'date', 'Дата'], ['time_window', 'text', 'Время суток']],
        say: 'Можно прийти в субботу в 14:00?' },
      garage: { welcome: 'Какая услуга нужна вашему автомобилю?', phrase: 'запишите мой BMW X5 на техосмотр в субботу после обеда, если получится',
        data: { service: 'Техосмотр', vehicle: 'BMW X5', date: 'D6', time_window: 'После обеда' },
        cardsLabel: 'Время', results: [['Пост 2', 'Техосмотр · сб 13:00'], ['Пост 4', 'Техосмотр · сб 14:30'], ['Пост 1', 'Техосмотр · сб 16:00']],
        reply: 'На субботу после обеда свободны 3 окна. Какое выберете?',
        fields: [['service', 'text', 'Услуга'], ['vehicle', 'text', 'Автомобиль'], ['date', 'date', 'Дата'], ['time_window', 'text', 'Время суток']],
        say: 'Проверка тормозов на моём Golf в пятницу, в 9:00' },
      table: { welcome: 'На какое время нужен столик?', phrase: 'забронируйте столик на 4 человека в пятницу в 20:00, у окна, пожалуйста',
        data: { party_size: '4', date: 'D5', time: '20:00', seating: 'У окна' },
        cardsLabel: 'Столик', results: [['У окна 2', '4 места · пт 20:00'], ['Веранда 5', '4 места · пт 20:15'], ['Бар 1', '4 места · пт 19:45']],
        reply: 'Около 20:00 свободны три столика. Какой выберете?',
        fields: [['party_size', 'text', 'Число гостей'], ['date', 'date', 'Дата'], ['time', 'time', 'Время'], ['seating', 'text', 'Место в зале']],
        say: 'Столик на двоих завтра на 19:00' },
      freight: { welcome: 'Что отправляем и куда?', phrase: 'две паллеты из Гданьска в Берлин, забрать в понедельник утром',
        data: { cargo: 'Паллета', quantity: '2', pickup_from: 'Гданьск', pickup_to: 'Берлин', date: 'D1', time_window: 'Утро' },
        cardsLabel: 'Время забора', results: [['Машина 12', 'пн 08:00 · Гданьск'], ['Машина 7', 'пн 09:30 · Гданьск'], ['Машина 3', 'пн 11:00 · Гданьск']],
        reply: 'На понедельник утром свободны три окна для забора груза. Какое выберете?',
        fields: [['cargo', 'text', 'Груз'], ['quantity', 'text', 'Количество'], ['pickup_from', 'text', 'Откуда'], ['pickup_to', 'text', 'Куда'], ['date', 'date', 'Дата забора груза'], ['time_window', 'text', 'Время суток']],
        say: 'Сможете забрать груз в понедельник в 10:00?' }
    },
    es: {
      salon: { welcome: '¡Hola! ¿Para qué quieres pedir cita?', phrase: 'mechas balayage y corte el próximo martes por la mañana, pelo largo',
        data: { service: 'Balayage + corte', hair_length: 'Largo', date: 'D2', time_window: 'Mañana' },
        cardsLabel: 'Estilista', results: [['Anna K.', 'Color · mar 09:30'], ['Marta L.', 'Color · mar 11:00'], ['Julia S.', 'Color · mar 10:15']],
        reply: 'Hay 3 estilistas libres el martes por la mañana. ¿Con quién prefieres?',
        fields: [['service', 'text', 'Servicio'], ['hair_length', 'text', 'Longitud del pelo'], ['date', 'date', 'Fecha'], ['time_window', 'text', 'Momento del día']],
        say: '¿Puedo ir el sábado a las 14:00?' },
      garage: { welcome: '¿Qué servicio necesita tu coche?', phrase: 'cita para la revisión de mi BMW X5, el sábado por la tarde si es posible',
        data: { service: 'Revisión', vehicle: 'BMW X5', date: 'D6', time_window: 'Tarde' },
        cardsLabel: 'Hueco', results: [['Elevador 2', 'Revisión · sáb 13:00'], ['Elevador 4', 'Revisión · sáb 14:30'], ['Elevador 1', 'Revisión · sáb 16:00']],
        reply: 'Hay 3 huecos libres el sábado por la tarde. ¿Cuál prefieres?',
        fields: [['service', 'text', 'Servicio'], ['vehicle', 'text', 'Vehículo'], ['date', 'date', 'Fecha'], ['time_window', 'text', 'Momento del día']],
        say: 'Revisión de frenos de mi Golf el viernes a las 9:00' },
      table: { welcome: '¿Para cuándo quieres la mesa?', phrase: 'reserva una mesa para 4 el viernes a las 20:00, junto a la ventana, por favor',
        data: { party_size: '4', date: 'D5', time: '20:00', seating: 'Junto a la ventana' },
        cardsLabel: 'Mesa', results: [['Ventana 2', '4 personas · vie 20:00'], ['Terraza 5', '4 personas · vie 20:15'], ['Barra 1', '4 personas · vie 19:45']],
        reply: 'Hay tres mesas libres sobre las 20:00. ¿Cuál prefieres?',
        fields: [['party_size', 'text', 'Comensales'], ['date', 'date', 'Fecha'], ['time', 'time', 'Hora'], ['seating', 'text', 'Ubicación']],
        say: 'Una mesa para dos mañana a las 19:00' },
      freight: { welcome: '¿Qué enviamos y adónde?', phrase: 'dos palés de Gdansk a Berlín, recogida el lunes por la mañana',
        data: { cargo: 'Palé', quantity: '2', pickup_from: 'Gdansk', pickup_to: 'Berlín', date: 'D1', time_window: 'Mañana' },
        cardsLabel: 'Recogida', results: [['Camión 12', 'lun 08:00 · Gdansk'], ['Camión 7', 'lun 09:30 · Gdansk'], ['Camión 3', 'lun 11:00 · Gdansk']],
        reply: 'Hay tres huecos libres para recoger el lunes por la mañana. ¿Cuál prefieres?',
        fields: [['cargo', 'text', 'Carga'], ['quantity', 'text', 'Cantidad'], ['pickup_from', 'text', 'Origen'], ['pickup_to', 'text', 'Destino'], ['date', 'date', 'Fecha de recogida'], ['time_window', 'text', 'Momento del día']],
        say: '¿Podéis recoger algo el lunes a las 10:00?' }
    }
  };
  var DAYS = { D1: 1, D2: 2, D5: 5, D6: 6 };
  /* One scenario in one language: the English base with the language's texts laid over it. */
  
function scenOf(id, lang) {
    var b = SCEN[id], o = LANG[lang] && LANG[lang][id], m = {}, k;
    for (k in b) m[k] = b[k];
    m.c = COMMON[lang] || COMMON.en; m.lang = COMMON[lang] ? lang : 'en';
    if (!o) return m;
    for (k in o) m[k] = o[k];
    var d = {}; for (k in o.data) d[k] = DAYS[o.data[k]] !== undefined ? nextDow(DAYS[o.data[k]]) : o.data[k];
    m.data = d;
    return m;
  }

export interface ScenarioCommon {
  tagline: string; name: string; phone: string; contact: string; who: string; tel: string;
  ask: string; review: string; confirmation: string; success: string; error: string; button: string;
}
/** One scenario in one language, as `scenOf` returns it. */
export interface Scenario {
  tab: string; brand: string; tagline: string; kind: string; welcome: string; phrase: string;
  extracted: Record<string, string>; data: Record<string, string>; endpoint: string; cardsField: string; cardsLabel: string;
  results: [string, string][]; reply: string; fields: [string, string, string][]; say: string;
  c: ScenarioCommon; lang: string;
}
export const scenario = (id: string, lang: string): Scenario => scenOf(id, lang) as Scenario;
export const SCENARIO_IDS: readonly string[] = Object.keys(SCEN);
export const SCEN_BASE: Record<string, Scenario> = SCEN;
export const SCEN_LANG: Record<string, Record<string, Record<string, unknown>>> = LANG;
export const SCEN_COMMON: Record<string, ScenarioCommon> = COMMON;
export { nextDow };

/* ---------- the tips, the notes and every other sentence the demo controller puts on the page (assets/demo.js), D1 ---------- */
export interface Tip {
  /** the block of the widget panel the tip talks about (a selector inside the widget's shadow root) */
  sel?: string;
  /** the tip is about the customer's own «request received» screen */
  success?: true;
  /** the tip is about the n-th block of the «Behind the chat» panel that replaces the widget after Send */
  after?: number;
  title: string;
  body: string;
}
export const TIPS: readonly Tip[] = [
  { sel: '.welcome-badges', title: 'Customers say what they need', body: 'The assistant listens for these details. A customer can give them in any order, typed or spoken. Each one is saved in the booking request.' },
  { sel: '.extracted-fields', title: 'What the assistant understood', body: 'Details pulled out of that one sentence. You get these same details by email or in your booking system.' },
  { sel: '.progress-card', title: 'The customer checks and sends', body: '' },
  { success: true, title: 'The customer is told: request received', body: 'A booking request, not a booking yet: the customer is told you will contact them to confirm.' },
  { after: 0, title: 'Free times can come from your booking system', body: 'If your booking system has an API, the assistant asks it what is free while the customer chats (here, a sample one). That is where the stylists came from. Without an API, the request simply reaches you by email.' },
  { after: 1, title: 'The booking request', body: 'The details the customer gave, sorted under labels, ready for you to act on.' },
  { after: 2, title: 'Delivered to you', body: 'By email, or straight into your booking system if one is connected. This demo sends a request, so your next step is to contact the customer to confirm.' }
];

/** Tip 3 carries live counts: «All 4 of 4 details came from 1 message. The customer checks them and taps Send.» */
export const TIP3 = {
  all: 'All', of: 'of', cameFrom: 'details came from', message: 'message', messages: 'messages',
  filled: 'All the details are filled in', tail: 'The customer checks them and taps Send.'
};

export const DEMO_TEXT = {
  noteAuto: 'Demo conversation in the real widget · click it to take over',
  noteStopped: 'The widget is the real one · the replies in this demo are scripted · voice gives the sample sentence',
  tipsHide: 'Hide tips',
  tipsShow: 'Show tips',
  tipWord: 'Tip',
  tipOf: 'of',
  jsonShow: 'Show as JSON',
  jsonHide: 'Show as list',
  afterAsked: 'Asked your system: who is free?',
  sentByEmail: 'By email · new booking request',
  sentToSystem: 'Or straight into your booking system, if connected · accepted (201)',
  chainSentMeta: 'your booking system · REST'
};

/** The sample the mock hands out to the browser's own consent record; the version is the product's (D4, checked by home-demo-contract). */
export const CONSENT_POLICY_VERSION = '2026-09-21';
// A UUID, because the widget sends this id as `userId` in every request and the product's schemas (consentUserIdSchema) accept a UUID only; B2(c) of home-demo.pw.ts holds that.
export const SCRIPT_USER_ID = '00000000-0000-4000-8000-000000000d3a';
/** The keys the widget stores under (consent.service.ts STORAGE_KEY / SESSION_KEY, lib/constants.ts STORAGE.PREFIX); home-demo-contract reads them from the product. */
export const CONSENT_STORAGE_KEY = 'typelessity_consent';
export const CONSENT_SESSION_KEY = 'typelessity_consent_session';
export const SESSION_KEY_PREFIX = 'typelessity_session_';
// `cfg_demo…` is the form configIdSchema of the product accepts for demonstration configs (api/src/lib/schemas.ts).
export const CONFIG_ID_PREFIX = 'cfg_demo_';
