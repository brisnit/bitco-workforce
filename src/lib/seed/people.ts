import type { Customer, Employee, Location, Organization, Team } from "@/lib/domain/types";

/**
 * FICTIONAL demonstration people and customers.
 * Only "Eran" (owner) refers to a real person; everyone else is invented.
 */

export const ORG_ID = "org-bitco";

export const organization: Organization = { id: ORG_ID, name: "BITCO Drilling Tools" };

export const locations: Location[] = [
  { id: "loc-main", orgId: ORG_ID, name: "Main Machine Shop", city: "Bakersfield, CA" },
];

export const teams: Team[] = [
  {
    id: "team-bit",
    orgId: ORG_ID,
    name: "Bit Shop",
    supervisorId: "emp-dale",
    description: "Retipping, bit repair and reconditioning.",
  },
  {
    id: "team-machining",
    orgId: ORG_ID,
    name: "Machining",
    supervisorId: "emp-rosa",
    description: "CNC and manual machining, threading and custom parts.",
  },
  {
    id: "team-fab",
    orgId: ORG_ID,
    name: "Fabrication",
    supervisorId: "emp-rosa",
    description: "Welding, hardbanding and metal fabrication.",
  },
  {
    id: "team-quality",
    orgId: ORG_ID,
    name: "Quality",
    supervisorId: "emp-dale",
    description: "Inspection and final sign-off.",
  },
];

type EmpInput = Omit<Employee, "orgId" | "active" | "skills"> & { skills?: string[] };
const emp = (e: EmpInput): Employee => ({ orgId: ORG_ID, active: true, skills: [], ...e });

export const employees: Employee[] = [
  emp({
    id: "emp-eran",
    role: "admin",
    firstName: "Eran",
    lastName: "",
    position: "Owner",
    teamId: null,
    supervisorId: null,
    workStatus: "available",
    skills: ["Operations", "Customer accounts"],
  }),
  emp({
    id: "emp-dale",
    role: "supervisor",
    firstName: "Dale",
    lastName: "Whitaker",
    position: "Shop Supervisor",
    teamId: "team-bit",
    supervisorId: "emp-eran",
    workStatus: "available",
    phone: "(661) 555-0142",
    startedOn: "2014-03-10",
    skills: ["Retipping", "Brazing", "Scheduling"],
  }),
  emp({
    id: "emp-rosa",
    role: "supervisor",
    firstName: "Rosa",
    lastName: "Delgado",
    position: "Shop Supervisor",
    teamId: "team-machining",
    supervisorId: "emp-eran",
    workStatus: "available",
    phone: "(661) 555-0187",
    startedOn: "2017-06-05",
    skills: ["CNC programming", "Blueprint review", "Fabrication"],
  }),
  emp({
    id: "emp-marcus",
    role: "worker",
    firstName: "Marcus",
    lastName: "Reyes",
    position: "Machinist",
    teamId: "team-bit",
    supervisorId: "emp-dale",
    workStatus: "on_job",
    phone: "(661) 555-0119",
    startedOn: "2019-09-16",
    skills: ["Tricone retipping", "Brazing", "Manual lathe"],
  }),
  emp({
    id: "emp-jasmine",
    role: "worker",
    firstName: "Jasmine",
    lastName: "Ortiz",
    position: "Repair Technician",
    teamId: "team-bit",
    supervisorId: "emp-dale",
    workStatus: "available",
    startedOn: "2021-02-01",
    skills: ["Reconditioning", "Hammer bits", "Hole openers"],
  }),
  emp({
    id: "emp-ben",
    role: "worker",
    firstName: "Ben",
    lastName: "Takahashi",
    position: "Repair Technician",
    teamId: "team-bit",
    supervisorId: "emp-dale",
    workStatus: "on_job",
    startedOn: "2022-08-22",
    skills: ["Hardbanding", "Bit repair"],
  }),
  emp({
    id: "emp-tyler",
    role: "worker",
    firstName: "Tyler",
    lastName: "Brooks",
    position: "CNC Operator",
    teamId: "team-machining",
    supervisorId: "emp-rosa",
    workStatus: "on_job",
    startedOn: "2020-04-13",
    skills: ["CNC mill", "CNC lathe", "Threading"],
  }),
  emp({
    id: "emp-kayla",
    role: "worker",
    firstName: "Kayla",
    lastName: "Jensen",
    position: "CNC Operator",
    teamId: "team-machining",
    supervisorId: "emp-rosa",
    workStatus: "available",
    startedOn: "2023-01-09",
    skills: ["CNC lathe", "First-article checks"],
  }),
  emp({
    id: "emp-luis",
    role: "worker",
    firstName: "Luis",
    lastName: "Navarro",
    position: "Machinist",
    teamId: "team-machining",
    supervisorId: "emp-rosa",
    workStatus: "off_today",
    startedOn: "2016-11-28",
    skills: ["Manual mill", "Thread repair", "Boring"],
  }),
  emp({
    id: "emp-hank",
    role: "worker",
    firstName: "Hank",
    lastName: "Sorensen",
    position: "Fabricator",
    teamId: "team-fab",
    supervisorId: "emp-rosa",
    workStatus: "on_job",
    startedOn: "2012-05-21",
    skills: ["MIG/TIG welding", "Plate fabrication", "Hardbanding"],
  }),
  emp({
    id: "emp-andre",
    role: "worker",
    firstName: "Andre",
    lastName: "Coleman",
    position: "Quality Inspector",
    teamId: "team-quality",
    supervisorId: "emp-dale",
    workStatus: "on_job",
    startedOn: "2018-07-30",
    skills: ["Dimensional inspection", "Thread gauging"],
  }),
];

export const customers: Customer[] = [
  { id: "cust-mesa", orgId: ORG_ID, name: "Mesa Valley Drilling", kind: "external", contactName: "R. Haskins" },
  { id: "cust-westbasin", orgId: ORG_ID, name: "West Basin Equipment", kind: "external", contactName: "T. Park" },
  { id: "cust-sierra", orgId: ORG_ID, name: "Sierra Well Services", kind: "external", contactName: "M. Quintero" },
  { id: "cust-desert", orgId: ORG_ID, name: "Desert Ridge Drilling", kind: "external", contactName: "J. Ames" },
  { id: "cust-kern", orgId: ORG_ID, name: "Kern River Water Wells", kind: "external", contactName: "L. Duarte" },
  { id: "cust-granite", orgId: ORG_ID, name: "Granite Pass Geothermal", kind: "external", contactName: "S. Lindqvist" },
  { id: "cust-sunbelt", orgId: ORG_ID, name: "Sunbelt HDD Contractors", kind: "external", contactName: "D. Ferris" },
  { id: "cust-internal", orgId: ORG_ID, name: "BITCO — Shop Maintenance", kind: "internal" },
];
