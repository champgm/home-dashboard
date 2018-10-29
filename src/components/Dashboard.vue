<template>

  <div class="hello">
    <div v-if="lights.length < 1">
        <v-progress-circular
      :size="50"
      color="amber"
      indeterminate
    ></v-progress-circular>
    </div>
    <div v-else>
      <v-container class="iconcontainer">
        <v-layout row justify-center wrap class="iconcontainer">
          <v-flex
            v-for="plug in plugs"
            v-bind:key="plug.id"
            class="buttonflex">
            <PlugButton :id="plug.id"></PlugButton>
          </v-flex>
          <v-flex
            v-for="light in lights"
            v-if="lightReachable(light)"
            v-bind:key="light.id"
            class="buttonflex">
            <LightButton :lightId="light.id"></LightButton>
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
  get lights() {
    const lightMap = this.$store.getters[Getters.lights];
    const sorted = Object.values(lightMap).sort(byName);
    return sorted;
  }
  get lightsLoading() {
    return this.$store.getters[Getters.lightsLoading];
  }
  get plugs() {
    const plugMap = this.$store.getters[Getters.plugs];
    const sorted = Object.values(plugMap).sort(byName);
    return sorted;
  }
  get plugIds() {
    return Object.keys(this.$store.getters[Getters.plugs]);
  }
  public $store: MyStore;
  @Prop()
  private msg!: string;
  public lightReachable(light: ILight): boolean {
    return light.state.reachable;
  }
}

function byName(a, b) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}
</script>

<style scoped lang="scss">
.buttonflex {
  max-width: 105px;
  max-height: 155px;
}
.container {
  max-width: 600px;
}
</style>
