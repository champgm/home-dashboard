<template>
  <div class="plugbuttoncontainer">
    <v-btn
      large
      :color="getButtonColor()"
      class="plugbutton"
      v-on:click="toggle()"
    >
      <div class="plugbuttontitle">
        {{plug.name}}
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
      v-model="plug.isBeingEdited"
      scrollable
      max-width="600px"
      persistent
    >
      <v-card>
        <v-card-title>Edit Plug</v-card-title>
        <v-divider></v-divider>
          <v-card-text>
            <ObjectEditor
              :stateAddress="plugAddress"
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
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { IPlug } from "../util/IPlug";
import Api from "../util/Api";
import { stringify } from "querystring";
import ObjectEditor from "./ObjectEditor.vue";
import { MyStore, Mutators, Getters } from "@/store";

@Component({ components: { ObjectEditor } })
export default class PlugButton extends Vue {
  @Prop()
  private id!: string;
  private api = new Api();
  private editorVisible = false;
  private editableFields = ["name"];
  private fieldRules = {};
  get plugAddress() {
    return `plugs['${this.id}']`;
  }
  get plug(): IPlug {
    return this.$store.getters[Getters.plugs][this.id];
  }
  set plug(plug) {
    this.$set(this.$store.state.plugs, `[${this.id}]`, plug);
  }
  public async reset() {
    this.$set(this.plug, "isBeingEdited", false);
    await this.$store.dispatch(Mutators.refreshPlugs);
  }
  public async submit() {
    await this.$store.dispatch(Mutators.editPlug, this.plug);
  }
  public async toggle() {
    await this.$store.dispatch(Mutators.togglePlug, this.plug);
  }
  public getButtonColor() {
    if (this.plug.state.on) {
      return "warning";
    }
    return "primary";
  }
  public showEditor() {
    this.$set(this.plug, "isBeingEdited", true);
  }
}
</script>

<style scoped lang="scss">
.plugbuttoncontainer {
  padding-bottom: 10px;
  max-width: 113px;
}
.plugbuttontitle {
  position: absolute;
  white-space: normal !important;
}
.plugbutton {
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
</style>
