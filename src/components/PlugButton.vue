<template>
  <div class="buttoncontainer">
    <v-btn
      large
      :color="getButtonColor()"
      class="button"
      v-on:click="toggle()">
      <div class="buttontitle">
        {{plug.name}}
      </div>
    </v-btn>
    <v-btn fab dark absolute color="cyan" class="editbutton">
      <v-icon dark>edit</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { IPlug } from "../util/IPlug";
import Api from "../util/Api";
import { stringify } from "querystring";
import { Mutators } from "@/store";

@Component
export default class PlugButton extends Vue {
  @Prop()
  private plug!: IPlug;
  private api = new Api();
  async toggle() {
    console.log(`Will toggle plug: ${JSON.stringify(this.plug)}`);
    await this.$store.dispatch(Mutators.togglePlug, this.plug);
  }
  getButtonColor() {
    if (this.plug.state.on) {
      return "success";
    }
    return "primary";
  }
}
</script>

<style scoped lang="scss">
.buttoncontainer {
  padding-bottom: 10px;
  max-width: 113px;
}
.buttontitle {
  position: absolute;
  white-space: normal !important;
}
.button {
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
  z-index: 7000;
}
</style>
