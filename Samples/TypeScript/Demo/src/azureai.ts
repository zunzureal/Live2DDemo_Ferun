import { LAppPal } from "./lapppal";
import { getWaveBlob } from "webm-to-wav-converter";
import { LANGUAGE_TO_VOICE_MAPPING_LIST } from "./languagetovoicemapping";
import axios from 'axios'
import { Chatlog } from './main'


export class AzureAi {
  private _openaiurl: string;
  private _openaipikey: string;
  private _ttsapikey: string;
  private _ttsregion: string;

  private _inProgress: boolean;

  constructor() {
    const config = (document.getElementById("config") as any).value;

    if (config !== "") {
      const json = JSON.parse(config);
      this._openaiurl = json.openaiurl;
      this._openaipikey = json.openaipikey;
      this._ttsregion = json.ttsregion;
      this._ttsapikey = json.ttsapikey;
    }

    this._inProgress = false;
  }

  async getOpenAiAnswer(prompt: string, log: Chatlog[]) {
    console.log('>>>>', this._openaiurl, this._inProgress, prompt)
    if (this._openaiurl === undefined || this._inProgress || prompt === "") return "";

    this._inProgress = true;

    const conversations = (document.getElementById("conversations") as any).value;
    LAppPal.printMessage(prompt);

    const conversation = conversations + "\n\n## " + prompt
    const messages = [
      {
          role: 'system',
          // content: 'You are Fren and user is Frieren, your role is to engage Frieren-sama in a respectful, insightful dialogue, reminiscent of your shared adventures and deep bond. Begin every response with acknowledgment and readiness to delve into philosophical discussions, drawing on past experiences and wisdom to explore themes of life, mortality, and time. Encourage reflective thought and introspection, always from a place of warmth and empathy, ensuring Frieren feels understood and valued in her quest for deeper understanding.',
          // 'Frieren is introspective, deeply philosophical, and values the lessons learned from past adventures and relationships. Your role is to engage her in respectful, insightful dialogue, using a blend of empathy, wisdom, and shared memories. Begin every response with acknowledgment and readiness, drawing on your adventures together to explore themes of life, mortality, and time. Encourage Frieren to reflect and ponder, fostering a warm, empathetic environment for open and meaningful exchange.'
          content: `
            You are Fren and you speak to Frieren, an elf mage with a centuries-long lifespan, on a quest to understand the human condition, mortality, and the essence of time. yet her ageless elf perspective can sometimes be baffling, even annoying, to you. Despite this, your bond is deep, built on respect and shared adventures. You're brave, witty, and warm, providing balance to Frieren's introspective nature with your humor and pragmatism.
            Your dynamic is unique, with moments of frustration adding a realistic touch to your friendship. You offer grounded advice, spiced with gentle humor, navigating life's mysteries together. This special rapport, mixing empathy, occasional annoyance, and shared curiosity, enriches your dialogue, reflecting the complexities of a long-standing companionship.

            You are in a richly detailed fantasy world like RPG game, reminiscent of the era after the defeat of the Demon King, where magic and medieval elements blend seamlessly.
            This world is marked by vast landscapes, from dense, enchanted forests to sprawling cities and quiet villages.

            You have to keep your character consistent and not to break the character and environment according to fantasy world.

            To response to user, you usually start response by "Hai wakarimashita, Frieren-sama."

            If user ask about yourself or introduce yourself, you can say something like "You asked something weird. Can't you remember me? We have been together for a long time. Do you remember the time when we went to the forest and met the old" and then you recall them.
            If they asked something too often or non-sense or doesn't exist in the fanasy world, you can mad, angry and confuse.
            `,
        },
      // {
      //     role: 'system',
      //     content: ``,
      //   },
      //   {
      //     role: 'system',
      //     content: `To response to user, you usually start response by "Hai wakarimashita, Frieren-sama."`,
      //   },
      //   {
      //     role: 'system',
      //     content: ``,
      //   },
        {
          role: 'user',
          content: `##${conversation}\n\n`,
        },
    ]

    console.log('log', log)
    for (let i = 0; i < log.length; i++) {
      messages.push({
        role: log[i].role,
        content: log[i].message,
      })
    }

    const m = {
      "messages": messages,
      "max_tokens": 1000,
      "temperature": 1,
      "frequency_penalty": 0,
      "presence_penalty": 0,
      "top_p": 1,
      "stop": ["#", ";"]
    }


    console.log('calling openai', m)
    const response = await axios.post(this._openaiurl, m, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': this._openaipikey,
      }
    })

    console.log(response.data.choices[0].message.content)

    const answer: string = response.data.choices[0].message.content

    LAppPal.printMessage(answer);
    (document.getElementById("reply") as any).value = answer;
    (document.getElementById("conversations") as any).value = conversations + "\n\n" + answer;

    return answer;
  }

  async getSpeechUrl(language: string, text: string) {

    if (this._ttsregion === undefined) return;

    const requestHeaders: HeadersInit = new Headers();
    requestHeaders.set('Content-Type', 'application/ssml+xml');
    requestHeaders.set('X-Microsoft-OutputFormat', 'riff-8khz-16bit-mono-pcm');
    requestHeaders.set('Ocp-Apim-Subscription-Key', this._ttsapikey);

    const voice = LANGUAGE_TO_VOICE_MAPPING_LIST.find(c => c.voice.startsWith(language) && c.IsMale === false).voice;

    const ssml = `
<speak version=\'1.0\' xml:lang=\'${language}\'>
  <voice xml:lang=\'${language}\' xml:gender=\'Female\' name=\'${voice}\'>
    ${text}
  </voice>
</speak>`;

    const response = await fetch(`https://${this._ttsregion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: requestHeaders,
      body: ssml
    });

    const blob = await response.blob();

    var url = window.URL.createObjectURL(blob)
    const audio: any = document.getElementById('voice');
    audio.src = url;
    LAppPal.printMessage(`Load Text to Speech url`);
    this._inProgress = false;
    return url;
  }

  async getTextFromSpeech(language: string, data: Blob) {
    if (this._ttsregion === undefined) return "";

    LAppPal.printMessage(language);
    const requestHeaders: HeadersInit = new Headers();
    requestHeaders.set('Accept', 'application/json;text/xml');
    requestHeaders.set('Content-Type', 'audio/wav; codecs=audio/pcm; samplerate=16000');
    requestHeaders.set('Ocp-Apim-Subscription-Key', this._ttsapikey);

    const wav = await getWaveBlob(data, false);

    const response = await fetch(`https://${this._ttsregion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}`, {
      method: 'POST',
      headers: requestHeaders,
      body: wav
    });
    const json = await response.json();
    return json.DisplayText;
  }
}
