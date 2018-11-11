<template>
  <div class="hello">
    <div v-if="groups.length < 1">
      <v-progress-circular :size="50" color="amber" indeterminate></v-progress-circular>
    </div>
    <div v-else>
      <v-container class="iconcontainer">
        <v-layout row justify-center wrap="" class="iconcontainer">
          <v-flex v-for="group in groups" v-bind:key="group.id" class="buttonflex">
            <GroupButton :id="group.id" :stateAddress="stateAddress"></GroupButton>
          </v-flex>
        </v-layout>
      </v-container>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import GroupButton from '@/components/GroupButton.vue';
import { MyStore, Mutate, Get } from '@/store';
import { ILightGroup } from 'node-hue-api';
import { byName } from '../util/Objects';

@Component({ components: { GroupButton } })
export default class Groups extends Vue {
  private stateAddress = 'groups';
  get groups() {
    const groups = this.$store.getters[Get.groups];
    const sorted = Object.values(groups).sort(byName);
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
