<template>

  <div class="hello">
    <div v-if="lightsLoading">
        <v-progress-circular
      :size="50"
      color="amber"
      indeterminate
    ></v-progress-circular>
    </div>
    <div v-else>
      <v-container class="iconcontainer">
        <v-layout row justify-center wrap class="iconcontainer">
          <v-flex v-for="plugId in plugIds" v-bind:key="plugId">
            <PlugButton :plug="plugs[plugId]"></PlugButton>
          </v-flex>
          <v-flex
            v-for="lightId in lightIds"
            v-bind:key="lightId"
            v-if="lightReachable(lights[lightId])">
            <LightButton :light="lights[lightId]"></LightButton>
          </v-flex>
        </v-layout>
      </v-container>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import LightButton from "@/components/LightButton.vue";
import PlugButton from "@/components/PlugButton.vue";
import { MyStore, Mutators, Getters } from "@/store";
import { ILight } from "node-hue-api";

@Component({
  components: {
    LightButton,
    PlugButton
  }
})
export default class Dashboard extends Vue {
  @Prop()
  private msg!: string;
  $store: MyStore;
  // private lights: ILight[] = [];
  async created() {
    // this.$set(this, "lights", await this.$store.state.lightsPromise);
    // console.log(`got lights: ${JSON.stringify(this.lights, null, 2)}`);
  }
  lightReachable(light: ILight): boolean {
    return light.state.reachable;
  }
  get lights() {
    return this.$store.getters[Getters.lights];
  }
  get lightIds() {
    return Object.keys(this.$store.getters[Getters.lights]);
  }
  get lightsLoading() {
    return this.$store.getters[Getters.lightsLoading];
  }
  get plugs() {
    return this.$store.getters[Getters.plugs];
  }
  get plugIds() {
    return Object.keys(this.$store.getters[Getters.plugs]);
  }
}
</script>

<style scoped lang="scss">
.container {
  max-width: 600px;
}
</style>
