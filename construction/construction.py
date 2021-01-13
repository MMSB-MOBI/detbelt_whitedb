import sys
import argparse 
import requests
import os, tarfile, shutil
import time
import xml.etree.ElementTree as ET
import json

XML_DL = "https://blanco.biomol.uci.edu/mpstruc/listAll/mpstrucTblXml"
PDB_DL = "https://storage.googleapis.com/opm-assets/pdb/tar_files/all_pdbs.tar.gz"

def args_gestion():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", help = f"Directory to put downloaded and or created files. Subdirectories will be created", required = True)
    parser.add_argument("--xml", help = f"whiteDB xml files. If not provided, will be downloaded from {XML_DL}")
    parser.add_argument("--pdb", help = f"PDB archives. If not provided, will be downloaded from {PDB_DL}")
    return parser.parse_args()

def download_xml(path, output):
    print(f"Download {path}")
    r = requests.get(path)
    with open(output, "w") as o:
        o.write(r.text)
    print(f"File written to {output}")

def download_tar(path, output):
    global ARGS
    if not path.endswith(".tar.gz"):
        raise Exception(f"{path} is not .tar.gz archive, can't be downloaded with download_tar")
    print(f"Download {path}")
    r = requests.get(path, stream = True)
    with open(output, "wb") as o:
        o.write(r.raw.read())
    print(f"Downloaded in {output}")

#https://stackoverflow.com/questions/191536/converting-xml-to-json-using-python
def parseXmlToJson(xml):
    response = {}
    for child in list(xml):
        if len(list(child)) > 0:
            response[child.tag] = parseXmlToJson(child)
        else:
            response[child.tag] = child.text or ''
    return response

def recursive_parse(xml):
    response = {}
    for child in list(xml):
        if child.tag == "memberProteins":
            response[child.tag] = [prot.find("pdbCode").text for prot in child.findall("memberProtein")]
        else:
            if len(list(child)) > 0:
                response[child.tag] = parseXmlToJson(child)
            else:
                response[child.tag] = child.text or ''
    return response

def recursive_parse_del_members(xml):
    response = {}
    for child in list(xml):
        if child.tag != "memberProteins":
            if len(list(child)) > 0:
                response[child.tag] = parseXmlToJson(child)
            else:
                response[child.tag] = child.text or ''
    return response

def convert_xml_to_json_no_hierarchy(xml, json_file, available_pdb):
    json_data = []
    kept_pdb = []
    tree = ET.parse(xml)
    root = tree.getroot()
    groups = root.findall("groups/group")
    for group in groups:
        group_name = group.find("name").text
        for subgroup in group.findall("subgroups/subgroup"):
            subgroup_name = subgroup.find("name").text
            
            for master_protein in subgroup.findall("proteins/protein"):
                pdb_code = master_protein.find("pdbCode").text
                master_name = master_protein.find("name").text
                if pdb_code in available_pdb:
                    if pdb_code in kept_pdb:
                        print(f"WARNING {pdb_code} is duplicated, the first has been taken")
                    else:
                        kept_pdb.append(pdb_code)
                        entry = recursive_parse_del_members(master_protein)
                        entry["group"] = group_name
                        entry["subgroup"] = subgroup_name
                        entry["representativeOf"] = master_name
                        json_data.append(entry)

                for member_protein in master_protein.findall("memberProteins/memberProtein"):
                    member_code = member_protein.find("pdbCode").text
                    if member_code in available_pdb:
                        if member_code in kept_pdb:
                            print(f"WARNING {member_code} is duplicated, the first has been taken")
                        else:
                            kept_pdb.append(member_code)
                            member_entry = recursive_parse_del_members(member_protein)
                            member_entry["group"] = group_name
                            member_entry["subgroup"] = subgroup_name
                            del member_entry["masterProteinPdbCode"]
                            member_entry["representativeOf"] = master_name
                            json_data.append(member_entry)

    json.dump(json_data, open(json_file, "w"))
    print(f"json converted written in {json_file}")
    return kept_pdb


def convert_xml_to_json(xml, json_file, available_pdb):
    json_data = []
    kept_pdb = []
    tree = ET.parse(xml)
    root = tree.getroot()
    groups = root.findall("groups/group")
    for group in groups:
        group_name = group.find("name").text
        for subgroup in group.findall("subgroups/subgroup"):
            subgroup_name = subgroup.find("name").text
            
            for master_protein in subgroup.findall("proteins/protein"):
                current_master = None
                pdb_code = master_protein.find("pdbCode").text

                if pdb_code in available_pdb:
                    kept_pdb.append(pdb_code)
                    entry = recursive_parse(master_protein)
                    entry["group"] = group_name
                    entry["subgroup"] = subgroup_name
                    current_master = entry

                member_proteins = []
                for member_protein in master_protein.findall("memberProteins/memberProtein"):
                    member_code = member_protein.find("pdbCode").text
                    if member_code in available_pdb:
                        kept_pdb.append(pdb_code)
                        member_entry = recursive_parse(member_protein)
                        member_entry["group"] = group_name
                        member_entry["subgroup"] = subgroup_name
                        member_proteins.append(member_entry)

                if not current_master and member_proteins: #new master proteins, the member one with highest resolution
                    member_proteins.sort(key=lambda prot: float(prot["resolution"]), reverse=True)
                    current_master = member_proteins[0]
                    if len(member_proteins) == 1:
                        member_proteins = []
                    else:
                        member_proteins = member_proteins[1:]
                    del current_master["masterProteinPdbCode"]
                    current_master["memberProteins"] = []
                    for other_prot in member_proteins:
                        current_master["memberProteins"].append(other_prot["pdbCode"])
                        other_prot["masterProteinPdbCode"] = current_master["pdbCode"]

                if current_master:
                    json_data.append(current_master)
                json_data = json_data + member_proteins

    json.dump(json_data, open(json_file, "w"))
    print(f"json converted written in {json_file}")
    return kept_pdb

    

def convert_xml_to_json2(xml, json_file, available_pdb):
    json_data = []
    kept_pdb = []
    tree = ET.parse(xml)
    root = tree.getroot()
    proteins = root.findall("groups/group/subgroups/subgroup/proteins/protein")
    for prot in proteins:
        pdb_code = prot.find("pdbCode").text
        if pdb_code in available_pdb:
            kept_pdb.append(pdb_code)
            json_prot = parseXmlToJson(prot)
            json_data.append(json_prot)

    json.dump(json_data, open(json_file, "w"))
    print(f"json converted written in {json_file}")
    return kept_pdb

def list_available_pdbs(pdb_archive):
    available_pdb = {}
    archive = tarfile.open(pdb_archive, "r:gz")
    for member in archive.getmembers():
        code = member.name.split("/")[-1].split(".")[0].upper()
        available_pdb[code] = member
    archive.close()
    return available_pdb

def extract_tar(pdb_archive, members_to_keep, extract_place):
    archive = tarfile.open(pdb_archive, "r:gz")
    archive.extractall(extract_place, members_to_keep)
    archive.close()

if __name__ == "__main__":
    ARGS = args_gestion()
    timestamp = time.strftime("%Y%m%d-%H%M%S")

    xml_output = f"{ARGS.out_dir}/whiteDB_{timestamp}.xml"
    if not ARGS.xml: 
        download_xml(XML_DL, xml_output)
        final_xml = xml_output
    else:
        print("Copy xml file")
        shutil.copy(ARGS.xml, xml_output)

    pdb_output = f"{ARGS.out_dir}/opmPDB_{timestamp}.tar.gz"
    final_pdb = f"{ARGS.out_dir}/opmPDB_{timestamp}"
    if not ARGS.pdb:
        download_tar(PDB_DL, pdb_output)
        
    else:
        print("Copy pdb archive")
        shutil.copy(ARGS.pdb, pdb_output)

    print(f"XML file : {xml_output}")
    print(f"PDB directory : {pdb_output}")

    available_pdbs = list_available_pdbs(pdb_output)

    json_converted = f"{ARGS.out_dir}/whiteDB_{timestamp}.json"

    kept_pdbs = convert_xml_to_json_no_hierarchy(xml_output, json_converted, available_pdbs)
    print(f"{len(kept_pdbs)} pdbs")
    kept_members = [available_pdbs[k] for k in available_pdbs if k in kept_pdbs]
    extract_tar(pdb_output, kept_members, ARGS.out_dir)
    os.rename(ARGS.out_dir + "/pdb", final_pdb) #WARNING needs to be changed if the tar.gz structure changed  

    print(f"{len(kept_members)} common pdbs between OPM and WhiteDB")
    print(f"Final json to insert to tingo : {json_converted}")
    print(f"Final pdb directory : {final_pdb}")
    


