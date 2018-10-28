<template>
  <div class="lightbuttoncontainer">
    <v-btn
      large
      :color="getButtonColor()"
      class="lightbutton"
      v-on:click="toggle()">
      <div class="lightbuttontitle">
        {{light.name}}
      </div>
    </v-btn>
    <v-btn fab dark color="cyan" class="editbutton">
      <v-icon dark>edit</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { ILight } from "node-hue-api";
import Api from "../util/Api";
import { stringify } from "querystring";
import { Mutators } from "@/store";

@Component
export default class LightButton extends Vue {
  @Prop()
  private light!: ILight;
  private api = new Api();
  async toggle() {
    console.log(`Will toggle light: ${JSON.stringify(this.light)}`);
    await this.$store.dispatch(Mutators.toggleLight, this.light);
  }
  getButtonColor() {
    if (this.light.state.on) {
      return "warning";
    }
    return "primary";
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
  z-index: 7000;
}
</style>
