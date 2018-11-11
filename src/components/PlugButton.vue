<template>
  <div class="plugbuttoncontainer">
    <v-btn large :color="getButtonColor()" class="plugbutton" v-on:click="toggle()">
      <div class="plugbuttontitle">{{plug.name}}</div>
    </v-btn>
    <v-btn fab dark color="cyan" class="editbutton" v-on:click="showEditor()">
      <v-icon dark>edit</v-icon>
    </v-btn>
    <v-dialog v-model="plug.isBeingEdited" scrollable max-width="600px" persistent>
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
import { Component, Prop, Vue } from 'vue-property-decorator';
import { IPlug } from '../util/Interfaces';
import Api from '../util/Api';
import { stringify } from 'querystring';
import ObjectEditor from './ObjectEditor.vue';
import { MyStore, Mutate, Get } from '@/store';

@Component({ components: { ObjectEditor } })
export default class PlugButton extends Vue {
  @Prop()
  private id!: string;
  private api = new Api();
  private editorVisible = false;
  private editableFields = ['name'];
  private fieldRules = {};
  private toggleFavoriteOnSubmit = false;
  get plugAddress() {
    return `plugs['${this.id}']`;
  }
  get plug(): IPlug {
    return this.$store.getters[Get.plugs][this.id];
  }
  set plug(plug) {
    this.$set(this.$store.state.plugs, `[${this.id}]`, plug);
  }
  public isFavorite() {
    const favoriteIds: string[] = this.$store.getters[Get.favoriteIds].plugs;
    const isFavorite = favoriteIds.indexOf(this.id) > -1;
    const isFavoriteNoToggle = !this.toggleFavoriteOnSubmit && isFavorite;
    const notFavoriteButToggle = this.toggleFavoriteOnSubmit && !isFavorite;
    return isFavoriteNoToggle || notFavoriteButToggle;
  }
  public async toggleFavorite() {
    this.toggleFavoriteOnSubmit = !this.toggleFavoriteOnSubmit;
  }
  public async reset() {
    this.$set(this.plug, 'isBeingEdited', false);
    await this.$store.dispatch(Mutate.refreshPlugs);
    await this.$store.dispatch(Mutate.refreshFavorites);
  }
  public async submit() {
    if (this.toggleFavoriteOnSubmit) {
      await this.$store.dispatch(Mutate.toggleFavorite, this.plug);
      this.toggleFavoriteOnSubmit = false;
    }
    await this.$store.dispatch(Mutate.editPlug, this.plug);
  }
  public async toggle() {
    await this.$store.dispatch(Mutate.togglePlug, this.plug);
  }
  public getButtonColor() {
    if (this.plug.state.on) {
      return 'warning';
    }
    return 'primary';
  }
  public showEditor() {
    this.$set(this.plug, 'isBeingEdited', true);
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
.favoritebutton {
  bottom: 70px !important;
}
</style>
