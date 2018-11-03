<template>
  <div class="objecteditor">
    <v-text-field
      v-if="hasName(thing)"
      v-model="thing.name"
      label="name"
      required
    ></v-text-field>
    <div v-for="key in keys(thing)" v-bind:key="key">
      <v-text-field
        v-if="isString(thing[key]) && key !== 'name'"
        :disabled="!isEditable(key)"
        v-model="thing[key]"
        :label="key"
        :rules="fieldRules[key]"
        required
      ></v-text-field>
      <v-checkbox
        v-else-if="isBoolean(thing[key]) && key !== 'isBeingEdited'"
        :disabled="!isEditable(key)"
        v-model="thing[key]"
        :label="key"
        required
      ></v-checkbox>
      <ObjectEditor
        v-else-if="key !== 'name'"
        :stateAddress="getSubAddress(key)"
        :editableFields="editableFields"
        :fieldRules="fieldRules"
        ></ObjectEditor>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import Api from "../util/Api";
import { stringify } from "querystring";
import { Mutate } from "@/store";
import { isObject } from "util";
import get from "lodash.get";
import set from "lodash.set";
import isBoolean from "lodash.isboolean";
import isString from "lodash.isstring";
import cloneDeep from "lodash.clonedeep";
import { isEmptyOrBlank } from "@/util/Objects";

@Component({ components: { ObjectEditor } })
export default class ObjectEditor extends Vue {
  @Prop()
  private stateAddress!: string;
  @Prop()
  private editableFields!: string[];
  @Prop()
  private fieldRules!: any;
  get thing() {
    const thing = get(this.$store.state, this.stateAddress);
    if (Array.isArray(thing)) {
      return JSON.stringify(thing);
    }
    return thing;
  }
  set thing(newThing) {
    try {
      const thingArray = JSON.parse(newThing);
      this.$set(this.$store.state, this.stateAddress, thingArray);
    } catch (error) {
      this.$set(this.$store.state, this.stateAddress, newThing);
    }
  }
  hasName(thing) {
    return thing.name === "" || !isEmptyOrBlank(thing.name);
  }
  public getSubAddress(key: string) {
    return `${this.stateAddress}.${key}`;
  }
  public isEditable(key: string) {
    return this.editableFields.indexOf(key) > -1;
  }
  public isObject(thing) {
    if (Array.isArray(thing)) {
      return false;
    }
    return isObject(thing);
  }
  public isString(thing) {
    if (Array.isArray(thing)) {
      // ;)
      return true;
    }
    return isString(thing);
  }
  public isBoolean(thing) {
    return isBoolean(thing);
  }
  public keys(thing) {
    return Object.keys(thing);
  }
  public asString(thing) {
    return String(thing);
  }
}
</script>

<style scoped lang="scss">
</style>
