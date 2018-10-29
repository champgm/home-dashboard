<template>

  <div class="hello">
    <div v-if="this.favorites.lights.length < 1 && this.favorites.plugs.length < 1">
      <div>
        No favorites found...
      </div>
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
            v-if="favorites.plugs.length > 0"
            v-for="plug in favorites.plugs"
            v-bind:key="plug.id"
            :stateAddress="plugStateAddress"
            class="buttonflex"
          >
            <PlugButton
              :id="plug.id"
              :stateAddress="plugStateAddress"
            ></PlugButton>
          </v-flex>
          <v-flex
            v-for="light in favorites.lights"
            v-if="favorites.lights.length > 0 && lightReachable(light)"
            v-bind:key="light.id"
            class="buttonflex"
          >
            <LightButton
              :lightId="light.id"
              :stateAddress="lightStateAddress"
            ></LightButton>
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
import { byName } from "../util/Objects";

@Component({
  components: {
    LightButton,
    PlugButton
  }
})
export default class Favorites extends Vue {
  private lightStateAddress = "lights";
  private plugStateAddress = "plugs";
  get favorites() {
    const favorites = this.$store.getters[Getters.favorites];
    const sorted = { plugs: favorites.plugs, lights: favorites.lights };
    return sorted;
  }
  public lightReachable(light: ILight): boolean {
    return light.state.reachable;
  }
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
