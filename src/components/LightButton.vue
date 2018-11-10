<template>
  <div class="lightbuttoncontainer">
    <v-btn
      large
      :color="getButtonColor()"
      class="lightbutton"
      v-on:click="toggle()"
    >
      <div class="lightbuttontitle">
        {{light.name}}
      </div>
    </v-btn>
    <v-btn
      fab
      dark
      color="cyan"
      class="editbutton"
      v-on:click="showEditor()"
    >
      <v-icon dark>edit</v-icon>
    </v-btn>
    <v-dialog
      v-model="light.isBeingEdited"
      scrollable
      max-width="600px"
      persistent
    >
      <v-card>
        <v-card-title>Edit Light</v-card-title>
        <v-divider></v-divider>
          <v-card-text>
            <ObjectEditor
              :stateAddress="lightAddress"
              :editableFields="editableFields"
              :fieldRules="fieldRules"
            ></ObjectEditor>
          </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn color="red darken-1" flat @click.native="reset()">Close</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" flat @click.native="submit()">Apply</v-btn>
        </v-card-actions>
        <v-btn
          class="favoritebutton"
          :color="isFavorite()? 'yellow' : 'grey' "
          small
          dark
          absolute
          bottom
          right
          fab
          v-on:click="toggleFavorite()"
        >
          <v-icon>star</v-icon>
        </v-btn>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { ILight } from "node-hue-api";
import Api from "../util/Api";
import { stringify } from "querystring";
import { isObject } from "util";
import ObjectEditor from "./ObjectEditor.vue";
import cloneDeep from "lodash.clonedeep";
import { MyStore, Mutate, Get } from "@/store";
import { isEmptyOrBlank } from "@/util/Objects";

@Component({ components: { ObjectEditor } })
export default class LightButton extends Vue {
  @Prop()
  private stateAddress!: string;
  @Prop()
  private id!: string;
  private api = new Api();
  private editorVisible = false;
  private toggleFavoriteOnSubmit = false;
  private editableFields = [
    "name",
    "on",
    "bri",
    "hue",
    "sat",
    "ct",
    "alert",
    "effect"
    // "xy",
    // "transitiontime",
    // "bri_inc",
    // "sat_inc",
    // "hue_inc",
    // "ct_inc",
    // "xy_inc"
  ];
  private fieldRules = {
    bri: [
      v => {
        return (1 <= parseInt(v) && parseInt(v) <= 254) || "Must be 1 to 254";
      }
    ],
    hue: [v => (0 <= v && v <= 65535) || "Must be 0 to 65535"],
    sat: [v => (1 <= parseInt(v) && v <= 254) || "Must be 1 to 254"],
    ct: [v => (153 <= v && v <= 500) || "Must be 153 to 500"],
    alert: [
      v =>
        v === "none" ||
        v === "select" ||
        v === "lselect" ||
        "Must be 'none' or 'select' or 'lselect'"
    ],
    effect: [
      v => v === "none" || v === "colorloop" || "Must be 'none' or 'colorloop'"
    ]
    // xy: [v => v || "asdf"],
    // transitiontime: [v => v || "asdf"],
    // bri_inc: [v => v || "asdf"],
    // sat_inc: [v => v || "asdf"],
    // hue_inc: [v => v || "asdf"],
    // ct_inc: [v => v || "asdf"],
    // xy_in: [v => v || "asdf"]
  };
  get lightAddress() {
    const address = `${this.stateAddress}.${this.id}`;
    return address;
  }
  get light() {
    return this.$store.getters[Get.lights][this.id];
  }
  set light(light) {
    this.$set(this.$store.state.lights, this.id, light);
  }
  public async reset() {
    this.$set(this.light, "isBeingEdited", false);
    await this.$store.dispatch(Mutate.refreshLights);
    await this.$store.dispatch(Mutate.refreshFavorites);
  }
  public isFavorite() {
    const favoriteIds: string[] = this.$store.getters[Get.favoriteIds].lights;
    const isFavorite = favoriteIds.indexOf(this.id) > -1;
    const isFavoriteNoToggle = !this.toggleFavoriteOnSubmit && isFavorite;
    const notFavoriteButToggle = this.toggleFavoriteOnSubmit && !isFavorite;
    return isFavoriteNoToggle || notFavoriteButToggle;
  }
  public async toggleFavorite() {
    this.toggleFavoriteOnSubmit = !this.toggleFavoriteOnSubmit;
  }
  public async submit() {
    if (this.toggleFavoriteOnSubmit) {
      await this.$store.dispatch(Mutate.toggleFavorite, this.light);
      this.toggleFavoriteOnSubmit = false;
    }
    await this.$store.dispatch(Mutate.editLight, this.light);
  }
  public async toggle() {
    await this.$store.dispatch(Mutate.toggleLight, this.light);
  }
  public getButtonColor() {
    if (this.light.state.on) {
      return "warning";
    }
    return "primary";
  }
  public showEditor() {
    this.$set(this.light, "isBeingEdited", true);
  }
}
</script>

<style scoped lang="scss">
.lightbuttoncontainer {
  padding-bottom: 10px;
  max-width: 113px;
}
.lightbuttontitle {
  position: absolute;
  white-space: normal !important;
}
.lightbutton {
  width: 88px !important;
  height: 88px !important;
  max-width: 88px !important;
  max-height: 88px !important;
}
.editbutton {
  width: 33px !important;
  height: 33px !important;
  top: -40px;
  left: 35px;
}
.favoritebutton {
  bottom: 70px !important;
}
</style>
