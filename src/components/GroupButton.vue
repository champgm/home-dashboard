<template>
  <div class="groupbuttoncontainer">
    <v-btn
      large
      :color="getButtonColor()"
      class="groupbutton"
      v-on:click="toggle()"
    >
      <div class="groupbuttontitle">
        {{group.name}}
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
      v-model="group.isBeingEdited"
      scrollable
      max-width="600px"
      persistent
    >
      <v-card>
        <v-card-title>Edit Group</v-card-title>
        <v-divider></v-divider>
          <v-card-text>
            <ObjectEditor
              :stateAddress="groupAddress"
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
import { ILightGroup } from "node-hue-api";
import Api from "../util/Api";
import { stringify } from "querystring";
import { isObject } from "util";
import ObjectEditor from "./ObjectEditor.vue";
import cloneDeep from "lodash.clonedeep";
import { MyStore, Mutate, Get } from "@/store";
import { isEmptyOrBlank } from "@/util/Objects";

@Component({ components: { ObjectEditor } })
export default class GroupButton extends Vue {
  @Prop()
  private stateAddress!: string;
  @Prop()
  private id!: string;
  private api = new Api();
  private editorVisible = false;
  private toggleFavoriteOnSubmit = false;
  private editableFields = ["name", "lights", "bri"];
  private fieldRules = {};
  get groupAddress() {
    const address = `${this.stateAddress}.${this.id}`;
    return address;
  }
  get group(): ILightGroup {
    return this.$store.getters[Get.groups][this.id];
  }
  set group(group: ILightGroup) {
    this.$set(this.$store.state.groups, this.id, group);
  }
  public async reset() {
    this.$set(this.group, "isBeingEdited", false);
    await this.$store.dispatch(Mutate.refreshGroups);
    await this.$store.dispatch(Mutate.refreshFavorites);
  }
  public isFavorite() {
    const favoriteIds: string[] = this.$store.getters[Get.favoriteIds].groups;
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
      await this.$store.dispatch(Mutate.toggleFavorite, this.group);
      this.toggleFavoriteOnSubmit = false;
    }
    await this.$store.dispatch(Mutate.editGroup, this.group);
  }
  public async toggle() {
    await this.$store.dispatch(Mutate.toggleGroup, this.group);
  }
  public getButtonColor() {
    try {
      if (this.group.action.on) {
        return "warning";
      }
      return "primary";
    } catch (error) {
      console.log(`Weird group found: ${JSON.stringify(this.group)}`);
      return "primary";
    }
  }
  public showEditor() {
    this.$set(this.group, "isBeingEdited", true);
  }
}
</script>

<style scoped lang="scss">
.groupbuttoncontainer {
  padding-bottom: 10px;
  max-width: 113px;
}
.groupbuttontitle {
  position: absolute;
  white-space: normal !important;
}
.groupbutton {
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
