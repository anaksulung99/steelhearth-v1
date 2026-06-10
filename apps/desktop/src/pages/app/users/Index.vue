<script lang="ts" setup>
import type { User } from "@/api";
import { Icon } from "@iconify/vue";
import { toast } from "vue-sonner";
import type { CreateUserWithLicenseDto, UpdateUserDto } from "@/api";

const userStore = useUserStore();
const { confirm, warning } = useGlobalAlert();

const search = ref("");
const roleFilter = ref("");
const showInviteUser = ref(false);
const showEditUser = ref(false);
const userDataAction = ref<User | null>(null);
const submitting = ref(false);

const inviteForm = reactive<CreateUserWithLicenseDto>({
  name: "",
  email: "",
  password: "",
  role: "USER",
  licenseKey: "",
  expiresAt: "",
});

const updateForm = reactive<UpdateUserDto>({
  name: "",
  email: "",
  password: undefined,
  role: "USER",
  isActive: true,
});

onMounted(() => userStore.fetchAll());

watch([search, roleFilter], () => {
  userStore.fetchAll({
    search: search.value || undefined,
    role: roleFilter.value || undefined,
  });
});
watch(userDataAction, (val) => {
  if (val) {
    updateForm.name = val.name;
    updateForm.email = val.email;
    updateForm.role = val.role;
    updateForm.isActive = val.isActive;
  }
});

async function handleDelete(data: User | null) {
  if (!data) {
    toast.error("User not found");
    return;
  }

  if (data.role === "OWNER") {
    toast.error("User with role OWNER can't be delete");
    return;
  }

  const ok = await confirm(
    `Delete "${data?.name}"?`,
    "This action cannot be undone.",
    {
      confirmLabel: "Delete",
      confirmClass: "bg-destructive text-destructive-foreground",
    }
  );
  if (!ok) return;
  await userStore.remove(data.id);
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);

  const units: { [key: string]: number } = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, secondsInUnit] of Object.entries(units)) {
    const interval = Math.floor(diffInSeconds / secondsInUnit);

    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }

  return "Just now";
}

const statusColor: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-600",
  INACTIVE: "bg-red-500/15 text-red-600",
};

async function submitInvite() {
  if (
    !inviteForm.name ||
    !inviteForm.email ||
    !inviteForm.password ||
    !inviteForm.role ||
    !inviteForm.licenseKey
  )
    return;
  submitting.value = true;
  const payload = { ...inviteForm } as CreateUserWithLicenseDto;

  await userStore.create(payload);
  submitting.value = false;
  showInviteUser.value = false;
}
async function submitUpdate() {
  if (!userDataAction.value) return;

  if (!updateForm.name || !updateForm.email || !updateForm.role) return;
  submitting.value = true;
  const payload = { ...inviteForm } as UpdateUserDto;

  await userStore.update(userDataAction.value.id, payload);
  submitting.value = false;
  showInviteUser.value = false;
}

function handleGenerateLicense() {
  inviteForm.licenseKey = generateLicenseKey();
}
</script>
<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Users</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ userStore.total }} total users
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        @click="showInviteUser = true"
      >
        <Icon icon="material-symbols:add" class="size-4" />
        Invite User
      </button>
    </div>

    <div class="flex gap-3">
      <input
        v-model="search"
        type="text"
        placeholder="Search users..."
        class="w-64 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <select
        v-model="roleFilter"
        class="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All Role</option>
        <option value="OWNER">Owner</option>
        <option value="ADMIN">Admin</option>
        <option value="USER">User</option>
      </select>
    </div>

    <div class="rounded-lg border bg-card overflow-hidden">
      <div
        v-if="userStore.loading"
        class="p-12 text-center text-sm text-muted-foreground"
      >
        Loading...
      </div>
      <div
        v-else-if="!userStore.items.length"
        class="p-12 text-center space-y-2"
      >
        <Icon
          icon="material-symbols:group"
          class="size-10 text-muted-foreground mx-auto"
        />
        <p class="text-sm text-muted-foreground">No users found</p>
        <button
          class="text-sm text-primary hover:underline"
          @click="showInviteUser = true"
        >
          <Icon icon="material-symbols:add" class="size-4" />
          Invite User
        </button>
      </div>
      <table v-else class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Name
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Email
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Status
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Role
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Expired At
            </th>
            <th class="px-4 py-2 text-left font-medium text-muted-foreground">
              Join At
            </th>
            <th class="px-4 py-2 text-right font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr
            v-for="c in userStore.items"
            :key="c.id"
            class="hover:bg-muted/30 transition-colors"
          >
            <td class="px-4 py-2.5">
              <button class="font-medium hover:text-primary">
                {{ c.name }}
              </button>
            </td>
            <td class="px-4 py-2.5 max-w-xs">
              <span class="truncate block text-muted-foreground text-xs"
                >{{ c.email }}
              </span>
            </td>
            <td class="px-4 py-2.5">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="statusColor[c.isActive ? 'ACTIVE' : 'INACTIVE']"
              >
                {{ c.isActive ? "Active" : "Inactive" }}
              </span>
            </td>
            <td class="px-4 py-2.5 max-w-xs">
              <span class="truncate block text-muted-foreground text-xs"
                >{{ c.role }}
              </span>
            </td>
            <td class="px-4 py-2.5 max-w-16 truncate text-muted-foreground">
              {{
                c.role === "OWNER"
                  ? "Life Time"
                  : getTimeAgo(new Date(c.license.expiresAt as string))
              }}
            </td>
            <td class="px-4 py-2.5 text-muted-foreground text-xs">
              {{ getTimeAgo(new Date(c.createdAt)) }}
            </td>
            <td class="px-4 py-2.5">
              <div class="flex items-center justify-end gap-1">
                <button
                  title="Edit"
                  class="p-1 rounded hover:bg-muted text-muted-foreground"
                  @click="
                    () => {
                      userDataAction = c;
                      showEditUser = true;
                    }
                  "
                >
                  <Icon icon="material-symbols:edit-outline" class="size-4" />
                </button>
                <button
                  title="Delete"
                  class="p-1 rounded hover:bg-red-500/10 text-destructive"
                  @click="handleDelete(c)"
                >
                  <Icon icon="material-symbols:delete-outline" class="size-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Dialog v-model:open="showInviteUser">
      <DialogContent class="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Invite user to collaborate access platform
          </DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="submitInvite">
          <div class="grid gap-4">
            <div class="grid gap-3">
              <Label for="name">Name</Label>
              <Input
                v-model="inviteForm.name"
                name="name"
                placeholder="John Doe"
                required
                class="bg-input"
                :disabled="submitting"
              />
            </div>
            <div class="grid gap-3">
              <Label for="email">Email</Label>
              <Input
                v-model="inviteForm.email"
                type="email"
                name="email"
                placeholder="john@example.com"
                required
                class="bg-input"
                :disabled="submitting"
              />
            </div>
            <div class="grid gap-3">
              <Label for="password">Password</Label>
              <Input
                v-model="inviteForm.password"
                type="password"
                name="password"
                placeholder="Your strong password"
                required
                class="bg-input"
                :disabled="submitting"
              />
            </div>
            <div class="grid gap-3">
              <Label for="role">Role</Label>
              <Select v-model="inviteForm.role" :disabled="submitting">
                <SelectTrigger class="bg-input">
                  <SelectValue class="bg-input" />
                </SelectTrigger>
                <SelectContent class="w-full">
                  <SelectGroup>
                    <SelectItem value="ADMIN"> Admin </SelectItem>
                    <SelectItem value="USER"> User </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-3">
              <Label for="licenseKey">License Key</Label>
              <div class="relative">
                <Input
                  v-model="inviteForm.licenseKey"
                  name="licenseKey"
                  placeholder="Your strong license Key"
                  required
                  class="bg-input"
                  :disabled="submitting"
                />
                <Button
                  size="icon-sm"
                  class="absolute right-0 top-1 h-7"
                  @click="handleGenerateLicense()"
                >
                  <Icon icon="material-symbols:key-rounded" />
                </Button>
              </div>
            </div>
            <div class="grid gap-3">
              <Label for="password">Password</Label>
              <DatePicker
                v-model:value="inviteForm.expiresAt"
                :disabled="submitting"
              />
            </div>
          </div>
          <div class="flex items-center justify-end w-full gap-2">
            <Button
              type="button"
              variant="outline"
              :disabled="submitting"
              @click="showInviteUser = false"
            >
              Cancel
            </Button>
            <Button type="submit" :disabled="submitting">
              <Spinner v-if="submitting" />
              {{ submitting ? "Submitting.." : "Invite User" }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="showEditUser">
      <form @submit.prevent="submitUpdate">
        <DialogContent class="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Update User </DialogTitle>
            <DialogDescription>
              Update user {{ userDataAction?.name }}
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4">
            <div class="grid gap-3">
              <Label for="name">Name</Label>
              <Input
                v-model="updateForm.name"
                name="name"
                placeholder="John Doe"
                required
                class="bg-input"
                :disabled="submitting"
              />
            </div>
            <div class="grid gap-3">
              <Label for="email">Email</Label>
              <Input
                v-model="updateForm.email"
                type="email"
                name="email"
                placeholder="john@example.com"
                required
                class="bg-input"
                :disabled="submitting"
              />
            </div>
            <div class="grid gap-3">
              <Label for="password">Password</Label>
              <Input
                v-model="updateForm.password"
                type="password"
                name="password"
                placeholder="Your strong password"
                required
                class="bg-input"
                :disabled="submitting"
              />
            </div>
            <div class="grid gap-3">
              <Label for="role">Role</Label>
              <Select v-model="updateForm.role" :disabled="submitting">
                <SelectTrigger class="bg-input">
                  <SelectValue class="bg-input" />
                </SelectTrigger>
                <SelectContent class="w-full">
                  <SelectGroup>
                    <SelectItem value="OWNER" disabled> Owner </SelectItem>
                    <SelectItem value="ADMIN"> Admin </SelectItem>
                    <SelectItem value="USER"> User </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-3">
              <Label for="isActive">Status</Label>
              <div class="flex items-center space-x-2">
                <Switch id="userStatus" v-model="updateForm.isActive" />
                <Label for="userStatus">
                  {{ updateForm.isActive ? "Active" : "Inactive" }}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button
                type="button"
                variant="outline"
                :disabled="submitting"
                @click="showInviteUser = false"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" :disabled="submitting">
              <Spinner v-if="submitting" />
              {{ submitting ? "Submitting.." : "Invite User" }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  </div>
</template>
