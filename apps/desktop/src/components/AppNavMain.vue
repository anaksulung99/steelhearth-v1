<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ChevronRight } from "@lucide/vue";

defineProps<{
  items: AppNavMain[];
}>();

const route = useRoute();
const router = useRouter();
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>Platform</SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible
        v-for="item in items"
        :key="item.title"
        as-child
        :default-open="item.isActive"
        class="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger as-child>
            <SidebarMenuButton
              :tooltip="item.title"
              :class="
                cn(
                  'cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-500 hover:font-bold',
                  {
                    'text-emerald-600 dark:text-emerald-500 font-bold':
                      route.fullPath === item.url,
                  }
                )
              "
              as-child
              @click="router.push(item.url)"
            >
              <div>
                <Icon v-if="item.icon" :icon="item.icon" />
                <span>{{ item.title }}</span>
                <ChevronRight
                  v-if="item.children"
                  class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                />
              </div>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub v-if="item.children">
              <SidebarMenuSubItem
                v-for="subItem in item.children"
                :key="subItem.title"
              >
                <SidebarMenuSubButton
                  :class="
                    cn(
                      'cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-500 hover:font-bold',
                      {
                        'text-emerald-600 dark:text-emerald-500 font-bold':
                          route.fullPath === subItem.url,
                      }
                    )
                  "
                  as-child
                  @click="router.push(subItem.url)"
                >
                  <div>
                    <span>{{ subItem.title }}</span>
                  </div>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>

<style scoped></style>
