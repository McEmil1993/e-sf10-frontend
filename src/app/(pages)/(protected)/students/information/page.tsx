"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/Button/Button";
import { DeleteIcon, EditIcon, ViewIcon } from "@/app/components/Icon/UserActionIcons";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import FormModal from "@/app/components/Modal/FormModal";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import Table from "@/app/components/Table/Table";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import rawBarangays from "@/app/data/barangays.json";
import rawCitiesMunicipalities from "@/app/data/cities-municipalities.json";
import rawProvinces from "@/app/data/provinces.json";
import rawRegions from "@/app/data/regions.json";
import rawSuffixes from "@/app/data/suffixes.json";
import type { ModalField, ModalFieldOption } from "@/app/types/components/modalTypes";
import type { ToastItem } from "@/app/types/components/toastTypes";
import type {
  StudentFormValues,
  StudentInformationLookups,
  StudentInformationLookup,
  StudentRecord,
  StudentStatus,
  StudentTableRow,
} from "@/app/types/studentTypes";
import type { TableColumn } from "@/app/types/tableTypes";
import {
  createStudent,
  deleteStudent,
  getStudentInformation,
  listStudentInformationLookups,
  listStudents,
  updateStudent,
  updateStudentInformation,
} from "@/app/utils/api";
import { createStudentsResponse, normalizeStudentRecord, toStudentTableRow } from "@/app/utils/studentsApi";

type DialogMode = "add" | "view" | "edit";

type StudentDialogState = {
  mode: DialogMode;
  studentId: number | null;
};

type StudentDeleteState = {
  studentId: number;
};

const statusToneMap = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  inactive: "bg-amber-50 text-amber-700 ring-amber-100",
  transferred: "bg-sky-50 text-sky-700 ring-sky-100",
  graduated: "bg-slate-100 text-slate-700 ring-slate-200",
};

const sexOptions: ModalFieldOption[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const statusOptions: ModalFieldOption[] = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Transferred", value: "transferred" },
  { label: "Graduated", value: "graduated" },
];

const suffixOptions: ModalFieldOption[] = (rawSuffixes as string[]).map((suffix) => ({
  label: suffix,
  value: suffix,
}));

const regions = rawRegions as Array<{ code: string; name: string; regionName: string }>;
const provinces = rawProvinces as Array<{ code: string; name: string; regionCode: string }>;
const citiesMunicipalities = rawCitiesMunicipalities as Array<{
  code: string;
  name: string;
  provinceCode: string;
  isCity: boolean;
  isMunicipality: boolean;
}>;
const barangays = rawBarangays as Array<{
  code: string;
  name: string;
  cityCode: string | false;
  municipalityCode: string | false;
}>;

const regionOptions: ModalFieldOption[] = regions.map((region) => ({
  label: `${region.regionName} - ${region.name}`,
  value: region.regionName,
}));

const emptyFormValues: StudentFormValues = {
  profile_picture: "",
  lrn: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  suffix: "",
  sex: "male",
  birthdate: "",
  birthplace: "",
  street_address: "",
  barangay: "",
  city_municipality: "",
  province: "Bohol",
  region: "Region VII",
  status: "active",
  mother_tongue: "",
  indigenous_group: "",
  indigenous_group_other: "",
  religion: "",
};

const emptyLookupValues: StudentInformationLookups = {
  mother_tongues: [],
  indigenous_groups: [],
  religions: [],
};

function createToastId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeLrnInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 20);
}

function toLookupOptions(values: StudentInformationLookup[]): ModalFieldOption[] {
  return values.map((value) => ({
    label: value.name,
    value: value.name,
  }));
}

function buildStudentFields(
  provinceOptions: ModalFieldOption[],
  cityMunicipalityOptions: ModalFieldOption[],
  barangayOptions: ModalFieldOption[],
  motherTongueOptions: ModalFieldOption[],
  indigenousGroupOptions: ModalFieldOption[],
  religionOptions: ModalFieldOption[],
  selectedIndigenousGroup: string,
): ModalField[] {
  const informationFields: ModalField[] = [
    {
      name: "mother_tongue",
      label: "Mother Tongue",
      type: "lookup",
      options: motherTongueOptions,
      placeholder: "Cebuano / Bisaya",
      layoutClassName: "md:col-span-6 xl:col-span-4",
    },
    {
      name: "indigenous_group",
      label: "IP (Ethnic Group)",
      type: "lookup",
      options: indigenousGroupOptions,
      placeholder: "Non-IP / Not Applicable",
      layoutClassName: "md:col-span-6 xl:col-span-4",
    },
    ...(selectedIndigenousGroup === "Other"
      ? [
          {
            name: "indigenous_group_other",
            label: "Specify IP / Ethnic Group",
            placeholder: "Enter group name",
            layoutClassName: "md:col-span-6 xl:col-span-4",
          } satisfies ModalField,
        ]
      : []),
    {
      name: "religion",
      label: "Religion",
      type: "lookup",
      options: religionOptions,
      placeholder: "Roman Catholic",
      layoutClassName: "md:col-span-6 xl:col-span-4",
    },
  ];

  return [
    {
      name: "profile_picture",
      label: "Profile Picture",
      type: "file",
      accept: "image/*",
      enableImageCrop: true,
      cropShape: "circle",
      cropAspect: 1,
      layoutClassName: "md:col-span-6 xl:col-span-6",
    },
    {
      name: "lrn",
      label: "LRN",
      placeholder: "123456789012",
      required: true,
      helperText: "Enter digits only, up to 20 characters.",
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: statusOptions,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "first_name",
      label: "First Name",
      placeholder: "Juan",
      required: true,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "middle_name",
      label: "Middle Name",
      placeholder: "Santos",
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "last_name",
      label: "Last Name",
      placeholder: "Dela Cruz",
      required: true,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "suffix",
      label: "Suffix",
      placeholder: "Jr.",
      type: "lookup",
      options: suffixOptions,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "sex",
      label: "Sex",
      type: "select",
      options: sexOptions,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "birthdate",
      label: "Birthdate",
      type: "date",
      required: true,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "birthplace",
      label: "Birthplace",
      placeholder: "Talisay City",
      layoutClassName: "md:col-span-6 xl:col-span-6",
    },
    ...informationFields,
    {
      name: "region",
      label: "Region",
      type: "lookup",
      options: regionOptions,
      placeholder: "Region VII",
      layoutClassName: "md:col-span-6 xl:col-span-4",
    },
    {
      name: "province",
      label: "Province",
      type: "lookup",
      options: provinceOptions,
      placeholder: "Cebu",
      layoutClassName: "md:col-span-6 xl:col-span-4",
    },
    {
      name: "city_municipality",
      label: "Municipality / City",
      type: "lookup",
      options: cityMunicipalityOptions,
      placeholder: "Talisay City",
      layoutClassName: "md:col-span-6 xl:col-span-4",
    },
    {
      name: "barangay",
      label: "Barangay",
      type: "lookup",
      options: barangayOptions,
      placeholder: "San Isidro",
      layoutClassName: "md:col-span-6 xl:col-span-4",
    },
    {
      name: "street_address",
      label: "Street Address",
      placeholder: "Purok 1, San Isidro",
      layoutClassName: "md:col-span-6 xl:col-span-8",
    },
  ];
}

function normalizeFormValues(student: StudentRecord | null): StudentFormValues {
  if (!student) {
    return emptyFormValues;
  }

  return {
    profile_picture: student.profile_picture ?? student.avatar ?? "",
    lrn: student.lrn,
    first_name: student.first_name,
    middle_name: student.middle_name ?? "",
    last_name: student.last_name,
    suffix: student.suffix ?? "",
    sex: student.sex,
    birthdate: student.birthdate,
    birthplace: student.birthplace ?? "",
    street_address: student.street_address ?? "",
    barangay: student.barangay,
    city_municipality: student.city_municipality,
    province: student.province,
    region: student.region,
    status: student.status,
    mother_tongue: "",
    indigenous_group: "",
    indigenous_group_other: "",
    religion: "",
  };
}

export default function StudentsInformationPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [lookupValues, setLookupValues] = useState<StudentInformationLookups>(emptyLookupValues);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogState, setDialogState] = useState<StudentDialogState | null>(null);
  const [deleteState, setDeleteState] = useState<StudentDeleteState | null>(null);
  const [formValues, setFormValues] = useState<StudentFormValues>(emptyFormValues);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const studentsResponse = useMemo(
    () =>
      createStudentsResponse(students, {
        page: currentPage,
        perPage: pageSize,
        search: searchTerm,
        sortBy: "created_at",
        sortOrder: "desc",
        basePath: "/students/information",
      }),
    [currentPage, pageSize, students, searchTerm],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      try {
        setIsLoading(true);
        const [studentData, studentLookupData] = await Promise.all([
          listStudents(),
          listStudentInformationLookups(),
        ]);

        if (!isMounted) {
          return;
        }

        setStudents(studentData.map(normalizeStudentRecord));
        setLookupValues(studentLookupData);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        showToast({
          tone: "error",
          title: "Unable to load students.",
          description: error instanceof Error ? error.message : "Please try again in a moment.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedRegion = useMemo(
    () => regions.find((region) => region.regionName === formValues.region || region.name === formValues.region) ?? null,
    [formValues.region],
  );

  const provinceOptions = useMemo(
    () =>
      provinces
        .filter((province) => !selectedRegion || province.regionCode === selectedRegion.code)
        .map((province) => ({
          label: province.name,
          value: province.name,
        })),
    [selectedRegion],
  );

  const selectedProvince = useMemo(
    () =>
      provinces.find(
        (province) =>
          province.name === formValues.province &&
          (!selectedRegion || province.regionCode === selectedRegion.code),
      ) ?? null,
    [formValues.province, selectedRegion],
  );

  const cityMunicipalityOptions = useMemo(
    () =>
      citiesMunicipalities
        .filter((cityMunicipality) => !selectedProvince || cityMunicipality.provinceCode === selectedProvince.code)
        .map((cityMunicipality) => ({
          label: cityMunicipality.name,
          value: cityMunicipality.name,
        })),
    [selectedProvince],
  );

  const selectedCityMunicipality = useMemo(
    () =>
      citiesMunicipalities.find(
        (cityMunicipality) =>
          cityMunicipality.name === formValues.city_municipality &&
          (!selectedProvince || cityMunicipality.provinceCode === selectedProvince.code),
      ) ?? null,
    [formValues.city_municipality, selectedProvince],
  );

  const barangayOptions = useMemo(
    () =>
      barangays
        .filter((barangay) => {
          if (!selectedCityMunicipality) {
            return false;
          }

          return (
            barangay.cityCode === selectedCityMunicipality.code ||
            barangay.municipalityCode === selectedCityMunicipality.code
          );
        })
        .map((barangay) => ({
          label: barangay.name,
          value: barangay.name,
        })),
    [selectedCityMunicipality],
  );

  const motherTongueOptions = useMemo(
    () => toLookupOptions(lookupValues.mother_tongues),
    [lookupValues.mother_tongues],
  );

  const indigenousGroupOptions = useMemo(
    () => toLookupOptions(lookupValues.indigenous_groups),
    [lookupValues.indigenous_groups],
  );

  const religionOptions = useMemo(
    () => toLookupOptions(lookupValues.religions),
    [lookupValues.religions],
  );

  const studentFields = useMemo(
    () =>
      buildStudentFields(
        provinceOptions,
        cityMunicipalityOptions,
        barangayOptions,
        motherTongueOptions,
        indigenousGroupOptions,
        religionOptions,
        formValues.indigenous_group,
      ),
    [
      barangayOptions,
      cityMunicipalityOptions,
      formValues.indigenous_group,
      indigenousGroupOptions,
      motherTongueOptions,
      provinceOptions,
      religionOptions,
    ],
  );

  const deleteTargetStudent = useMemo(
    () => students.find((student) => student.id === deleteState?.studentId) ?? null,
    [deleteState?.studentId, students],
  );

  const tableStudents: StudentTableRow[] = useMemo(
    () => studentsResponse.data.map(toStudentTableRow),
    [studentsResponse.data],
  );

  function showToast({
    description,
    duration,
    title,
    tone = "info",
  }: Omit<ToastItem, "id">) {
    setToasts((currentValue) => [
      ...currentValue.slice(-2),
      {
        id: createToastId(),
        title,
        description,
        tone,
        duration,
      },
    ]);
  }

  function dismissToast(toastId: string) {
    setToasts((currentValue) =>
      currentValue.filter((toast) => toast.id !== toastId),
    );
  }

  function openAddModal() {
    setFormValues(emptyFormValues);
    setDialogState({
      mode: "add",
      studentId: null,
    });
  }

  async function openViewPage(studentId: number) {
    try {
      const response = await fetch(`/api/students/route-token?id=${studentId}`);
      const payload = (await response.json()) as { message?: string; token?: string };

      if (!response.ok || !payload.token) {
        throw new Error(payload.message || "Unable to generate the student detail URL.");
      }

      router.push(`/students/information/${payload.token}`);
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to open student details.",
        description:
          error instanceof Error ? error.message : "Please try again in a moment.",
      });
    }
  }

  async function openEditModal(studentId: number) {
    const student = students.find((item) => item.id === studentId) ?? null;

    try {
      const information = await getStudentInformation(studentId);

      setFormValues({
        ...normalizeFormValues(student),
        mother_tongue: information.mother_tongue?.name ?? "",
        indigenous_group: information.indigenous_group?.name ?? "",
        indigenous_group_other: "",
        religion: information.religion?.name ?? "",
      });
      setDialogState({
        mode: "edit",
        studentId,
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to load student information.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    }
  }

  function openDeleteModal(studentId: number) {
    setDeleteState({ studentId });
  }

  function closeDialog() {
    setDialogState(null);
    setFormValues(emptyFormValues);
  }

  function closeDeleteDialog() {
    setDeleteState(null);
  }

  function handleFieldChange(name: string, value: string) {
    if (name === "lrn") {
      setFormValues((currentValue) => ({
        ...currentValue,
        lrn: normalizeLrnInput(value),
      }));
      return;
    }

    if (name === "region") {
      setFormValues((currentValue) => ({
        ...currentValue,
        region: value,
        province: value === "Region VII" ? "Bohol" : "",
        city_municipality: "",
        barangay: "",
      }));
      return;
    }

    if (name === "province") {
      setFormValues((currentValue) => ({
        ...currentValue,
        province: value,
        city_municipality: "",
        barangay: "",
      }));
      return;
    }

    if (name === "city_municipality") {
      setFormValues((currentValue) => ({
        ...currentValue,
        city_municipality: value,
        barangay: "",
      }));
      return;
    }

    if (name === "indigenous_group") {
      setFormValues((currentValue) => ({
        ...currentValue,
        indigenous_group: value,
        indigenous_group_other: value === "Other" ? currentValue.indigenous_group_other : "",
      }));
      return;
    }

    setFormValues((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  }

  function buildStudentPayload() {
    return {
      profile_picture: formValues.profile_picture.trim(),
      lrn: formValues.lrn.trim(),
      first_name: formValues.first_name.trim(),
      middle_name: formValues.middle_name.trim(),
      last_name: formValues.last_name.trim(),
      suffix: formValues.suffix.trim(),
      sex: formValues.sex,
      birthdate: formValues.birthdate,
      birthplace: formValues.birthplace.trim(),
      street_address: formValues.street_address.trim(),
      barangay: formValues.barangay.trim(),
      city_municipality: formValues.city_municipality.trim(),
      province: formValues.province.trim(),
      region: formValues.region.trim(),
      status: formValues.status as StudentStatus,
    };
  }

  function buildStudentInformationPayload() {
    const indigenousGroupOther = formValues.indigenous_group_other.trim();

    return {
      motherTongue: formValues.mother_tongue.trim() || null,
      indigenousGroup:
        formValues.indigenous_group.trim() === "Other"
          ? "Other"
          : formValues.indigenous_group.trim() || null,
      indigenousGroupOther:
        formValues.indigenous_group.trim() === "Other" && indigenousGroupOther
          ? indigenousGroupOther
          : undefined,
      religion: formValues.religion.trim() || null,
    };
  }

  async function handleSaveStudent() {
    if (!dialogState) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (dialogState.mode === "add") {
        const createdStudent = await createStudent(buildStudentPayload());
        await updateStudentInformation(createdStudent.id, buildStudentInformationPayload());

        setStudents((currentStudents) => [normalizeStudentRecord(createdStudent), ...currentStudents]);
        setCurrentPage(1);
        closeDialog();
        showToast({
          tone: "success",
          title: "Student created successfully.",
        });
        return;
      }

      if (dialogState.mode === "edit" && dialogState.studentId !== null) {
        const updatedStudent = await updateStudent(dialogState.studentId, buildStudentPayload());
        await updateStudentInformation(dialogState.studentId, buildStudentInformationPayload());

        setStudents((currentStudents) =>
          currentStudents.map((currentStudent) =>
            currentStudent.id === dialogState.studentId
              ? normalizeStudentRecord(updatedStudent)
              : currentStudent,
          ),
        );
        closeDialog();
        showToast({
          tone: "success",
          title: "Student updated successfully.",
        });
      }
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to save the student.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteStudent() {
    if (!deleteState?.studentId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteStudent(deleteState.studentId);
      setStudents((currentStudents) => currentStudents.filter((student) => student.id !== deleteState.studentId));
      closeDeleteDialog();
      showToast({
        tone: "success",
        title: "Student deleted successfully.",
        description: deleteTargetStudent?.full_name
          ? `${deleteTargetStudent.full_name} was removed from the list.`
          : undefined,
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to delete the student.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns: TableColumn<StudentTableRow>[] = [
    {
      key: "full_name",
      header: "Student",
      type: "stacked",
      showAvatar: true,
      avatarImageKey: "avatar",
      avatarFallbackKey: "full_name",
      secondaryKey: "lrn",
      valueClassName: "font-semibold text-slate-950",
      secondaryValueClassName: "text-xs text-muted",
    },
    {
      key: "sex",
      header: "Sex",
      valueClassName: "text-sm capitalize text-slate-700",
    },
    {
      key: "birthdate",
      header: "Birthdate",
      valueClassName: "text-sm text-slate-700",
    },
    {
      key: "location",
      header: "Address",
      valueClassName: "text-sm text-slate-700",
    },
    {
      key: "status",
      header: "Status",
      type: "badge",
      badgeClassName: "inline-flex rounded px-2 py-1 text-xs font-semibold ring-1 ring-inset capitalize",
      toneMap: statusToneMap,
    },
    {
      key: "actions",
      header: "Actions",
      type: "actions",
      className: "whitespace-nowrap",
      headerClassName: "w-[140px]",
      actions: [
        {
          label: "View",
          icon: <ViewIcon />,
          onClick: (row) => openViewPage(Number(row.id)),
          tone: "primary",
        },
        {
          label: "Edit",
          icon: <EditIcon />,
          onClick: (row) => openEditModal(Number(row.id)),
        },
        {
          label: "Delete",
          icon: <DeleteIcon />,
          onClick: (row) => openDeleteModal(Number(row.id)),
          tone: "danger",
        },
      ],
    },
  ];

  return (
    <PagePlaceholder
      breadcrumb="Home > Students > Information"
      sectionLabel="Students panel"
      title="Information"
    >
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <Button disabled={isSubmitting} onClick={openAddModal} size="sm">
            Add Student
          </Button>
        </div>

        <Table
          columns={columns}
          data={tableStudents}
          emptyMessage={isLoading ? "Loading students..." : "No students found."}
          pagination={{
            page: studentsResponse.meta.page,
            perPage: studentsResponse.meta.per_page,
            total: studentsResponse.meta.total,
            totalPages: studentsResponse.meta.total_pages,
            onPageChange: setCurrentPage,
            onPageSizeChange: (value) => {
              setPageSize(value);
              setCurrentPage(1);
            },
          }}
          search={{
            value: searchTerm,
            onChange: (value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            },
          }}
          searchPlaceholder="Search name, LRN, sex, status, or address"
        />
      </div>

      <FormModal
        bodyClassName="px-5 py-5 sm:px-5 sm:py-5"
        columns={3}
        fields={studentFields}
        fieldClassName="space-y-1"
        footerClassName="border-t border-border bg-card px-5 py-4 sm:px-5"
        gridClassName="grid-cols-1 md:grid-cols-6 xl:grid-cols-12 xl:auto-rows-min"
        headerClassName="border-b border-border px-5 py-3.5 sm:px-5"
        isOpen={Boolean(dialogState)}
        labelClassName="text-[13px] font-semibold text-slate-700"
        mode={dialogState?.mode ?? "view"}
        onChange={handleFieldChange}
        onClose={closeDialog}
        onSubmit={dialogState?.mode === "view" ? undefined : handleSaveStudent}
        panelClassName="rounded-[6px] border border-border bg-card shadow-[0_14px_38px_rgba(15,23,42,0.14)]"
        size="modal-large"
        submitLabel={
          isSubmitting
            ? dialogState?.mode === "edit"
              ? "Saving..."
              : "Creating..."
            : dialogState?.mode === "edit"
              ? "Save Changes"
              : "Create Student"
        }
        title={
          dialogState?.mode === "view"
            ? "View Student"
            : dialogState?.mode === "edit"
              ? "Edit Student"
              : "Add Student"
        }
        titleClassName="text-[17px] font-semibold text-slate-950 sm:text-[18px]"
        values={formValues}
      />

      <ConfirmModal
        confirmClassName="border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700"
        confirmLabel="Delete"
        description="Are you sure you want to delete"
        emphasisMessage="This action cannot be undone."
        emphasisTone="danger"
        isOpen={Boolean(deleteState)}
        itemLabel={deleteTargetStudent?.full_name ?? "this student"}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteStudent}
        title="Delete Student"
      />
    </PagePlaceholder>
  );
}
