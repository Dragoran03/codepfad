import type { LayersView, LessonCode, Step, TopoView } from '../../types.ts';

const L = {
  http: { label: 'HTTP', sub: 'GET /index.html', tone: 0 },
  tcp: { label: 'TCP', sub: 'Port 51344 → 443, Nr. 1001', tone: 1 },
  ip: { label: 'IP', sub: '192.168.1.20 → 93.184.215.14', tone: 2 },
  eth: { label: 'Ethernet', sub: 'MAC a4:83… → 3c:22…', tone: 3 },
};

const topo = (t?: number, hiA = false, hiB = false): TopoView => ({
  height: 120,
  nodes: [
    { id: 'pc', label: 'Dein Laptop', sub: 'Browser', kind: 'pc', x: 90, y: 60, hi: hiA },
    { id: 'netz', label: 'Netze', sub: 'Router, Kabel, Funk', kind: 'cloud', x: 320, y: 60 },
    { id: 'srv', label: 'Webserver', sub: 'example.org', kind: 'server', x: 550, y: 60, hi: hiB },
  ],
  links: [
    { a: 'pc', b: 'netz' },
    { a: 'netz', b: 'srv' },
  ],
  packets: t === undefined ? [] : [{ a: t < 1 ? 'pc' : 'netz', b: t < 1 ? 'netz' : 'srv', t: t < 1 ? 0.6 : 0.5, label: 'Paket' }],
});

const layers = (ls: LayersView['layers'], hi?: number): LayersView => ({ layers: ls, hi, payload: '„Zeig mir /index.html"' });

const lesson: LessonCode = {
  scenes: {
    kapselung: {
      title: 'Ein Paket wird ein- und wieder ausgepackt',
      build: (): Step[] => [
        { note: 'Der Browser will eine Webseite. Seine Nachricht ist einfacher Text – die Anwendung kümmert sich nicht darum, wie er ankommt.', topo: topo(undefined, true), layers: layers([], undefined) },
        { note: '**Anwendungsschicht:** HTTP formuliert die Anfrage nach den Regeln seines Protokolls.', topo: topo(undefined, true), layers: layers([L.http], 0) },
        { note: '**Transportschicht:** TCP packt sie ein und schreibt einen eigenen Kopf davor – mit Portnummern (welches Programm?) und einer Laufnummer, damit nichts verloren geht oder durcheinanderkommt.', topo: topo(undefined, true), layers: layers([L.tcp, L.http], 0) },
        { note: '**Vermittlungsschicht:** IP packt das Ganze erneut ein. Sein Kopf trägt die Absender- und Zieladresse im ganzen Internet.', topo: topo(undefined, true), layers: layers([L.ip, L.tcp, L.http], 0) },
        { note: '**Netzzugangsschicht:** Ethernet (oder WLAN) setzt einen letzten Rahmen herum – mit den Hardware-Adressen für das nächste Teilstück, hier zum Router. Erst jetzt wird das Paket als Bits über das Kabel geschickt.', topo: topo(undefined, true), layers: layers([L.eth, L.ip, L.tcp, L.http], 0) },
        { note: 'Unterwegs packt jeder Router nur bis zur IP-Schicht aus, schaut auf die Zieladresse und packt für das nächste Teilstück einen **neuen** Ethernet-Rahmen darum. Was innen steckt, interessiert ihn nicht.', topo: topo(0.5), layers: layers([L.eth, L.ip, L.tcp, L.http], 1) },
        { note: 'Beim Webserver geht es in umgekehrter Reihenfolge: Jede Schicht entfernt ihren Kopf, prüft ihn und reicht den Inhalt nach oben.', topo: topo(1, false, true), layers: layers([L.tcp, L.http], 0) },
        { note: 'Ganz oben kommt die Anfrage genau so an, wie der Browser sie geschrieben hat. Jede Schicht hat nur mit ihrer Gegenstelle auf derselben Ebene „gesprochen" – das ist der Trick, der das Internet beherrschbar macht.', topo: topo(1, false, true), layers: layers([L.http], 0) },
      ],
    },
  },

  exercises: [
    {
      kind: 'quiz',
      id: 'welche-schicht',
      title: 'Wer kümmert sich?',
      question: 'Ein Paket ist auf dem Weg verloren gegangen und muss erneut gesendet werden. Welche Schicht bemerkt das und sorgt dafür?',
      options: ['Die Anwendung (z. B. HTTP)', 'Die Transportschicht (TCP)', 'Die Vermittlungsschicht (IP)', 'Das Ethernet-Kabel'],
      correct: 1,
      explain:
        'IP liefert nach dem Prinzip „bestes Bemühen" (*best effort*): Pakete können verloren gehen, doppelt oder in falscher Reihenfolge ankommen. TCP nummeriert alle Bytes, lässt sich den Empfang bestätigen und schickt fehlende Teile erneut. Die Anwendung bekommt davon nichts mit – für sie sieht es aus wie ein lückenloser Datenstrom.',
    },
    {
      kind: 'quiz',
      id: 'warum-schichten',
      title: 'Wozu Schichten?',
      question: 'Was ist der größte Vorteil des Schichtenmodells?',
      options: [
        'Pakete werden dadurch kleiner.',
        'Jede Schicht lässt sich austauschen, ohne die anderen zu ändern: Dein Browser funktioniert gleich, ob die unterste Schicht WLAN, Glasfaser oder Mobilfunk ist.',
        'Es verschlüsselt automatisch alle Daten.',
        'Es macht Router überflüssig.',
      ],
      correct: 1,
      explain:
        'Jede Schicht bietet der darüberliegenden einen Dienst an und benutzt den der darunterliegenden – wie Funktionen, die nur über ihre Schnittstelle miteinander reden. Deshalb konnte WLAN erfunden werden, ohne dass HTTP sich ändern musste, und HTTP/3 konnte TCP durch ein anderes Protokoll ersetzen, ohne dass Webseiten neu geschrieben wurden.',
    },
  ],
};

export default lesson;
