<template>

  <div class="hello">
    <div v-if="plugs.length < 1">
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
            :stateAddress="stateAddress"
            class="buttonflex"
          >
            <PlugButton
              :id="plug.id"
              :stateAddress="stateAddress"
            ></PlugButton>
          </v-flex>
        </v-layout>
      </v-container>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import PlugButton from "@/components/PlugButton.vue";
import { MyStore, Mutators, Getters } from "@/store";
import { ILight } from "node-hue-api";
import { byName } from "../util/Objects";

@Component({ components: { PlugButton } })
export default class Plugs extends Vue {
  private stateAddress = "plugs";
  get plugs() {
    const plugs = this.$store.getters[Getters.plugs];
    const sorted = Object.values(plugs).sort(byName);
    return sorted;
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
