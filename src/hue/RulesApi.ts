import { dlete, get, post, put } from "../common/Parameters";
import { bridgeUri } from "../configuration/Hue";
import { create as RuleCreate, createSubmittable as createSubmittableRule, Rule, Rules } from "../models/Rule";
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
    const rule = await (await fetch(uri, get)).json();
    rule.id = id;
    return RuleCreate(rule);
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

  async create(rule: Rule): Promise<void> {
    const uri = `${bridgeUri}/rules`;
    const parameters: RequestInit = { ...post, body: JSON.stringify(rule) };
    const response = await (await fetch(uri, parameters)).json();
    console.log(`post rule response${JSON.stringify(response, null, 2)}`);
    triggerUpdate();
  }

  async put(rule: Rule): Promise<void> {
    const uri = `${bridgeUri}/rules/${rule.id}`;
    const submittableRule = createSubmittableRule(rule);
    const parameters: RequestInit = {
      ...put,
      body: JSON.stringify(submittableRule),
    };
    const response = await (await fetch(uri, parameters)).json();
    console.log(`put rule response${JSON.stringify(response, null, 2)}`);
    triggerUpdate();
  }

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
