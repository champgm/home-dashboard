import { dlete, get, post, put } from "../common/Parameters";
import { bridgeUri } from "../configuration/Hue";
import { create as RuleCreate, Rule, Rules } from "../models/Rule";
import { triggerUpdate } from "../tabs/common/Alerter";

export class RulesApi {

  async getAll(): Promise<Rules> {
    const uri = `${bridgeUri}/rules/`;
    let rulesMap = await (await fetch(uri, get)).json();
    rulesMap = this.attachId(rulesMap);
    return rulesMap;
  }

  async get(id: string): Promise<Rule> {
    const uri = `${bridgeUri}/rules/${id}`;
    const light = await (await fetch(uri, get)).json();
    light.id = id;
    return RuleCreate(light);
  }

  async delete(id: string) {
    const uri = `${bridgeUri}/rules/${id}`;
    await (await fetch(uri, dlete)).json();
    triggerUpdate();
  }

  async getSome(ids: string[]): Promise<Rules> {
    const allRules = this.getAll();
    Object.keys(allRules).forEach((key) => {
      if (!ids.includes(key)) {
        delete allRules[key];
      }
    });
    return allRules;
  }

  // async put(light: Rule): Promise<void> {
  //   const uri = `${bridgeUri}/rules/${light.id}`;
  //   if (light.state) {
  //     await this.putState(light.id, light.state);
  //   }
  //   const submittableRule = createSubmittableRule(light);
  //   const parameters: RequestInit = {
  //     ...put,
  //     body: JSON.stringify(submittableRule),
  //   };
  //   const response = await (await fetch(uri, parameters)).json();
  //   console.log(`put light response${JSON.stringify(response, null, 2)}`);
  //   triggerUpdate();
  // }

  attachId(rulesMap: Rules): Rules {
    for (const id of Object.keys(rulesMap)) {
      rulesMap[id].id = id;
      try {
        rulesMap[id] = RuleCreate(rulesMap[id]);
      } catch (error) {
        console.log(`Error: ${error}`);
        console.log(`Could not create rule: ${JSON.stringify(rulesMap[id], null, 2)}`);
      }
    }
    return rulesMap;
  }
}
