{ pkgs }: {
  deps = [
    pkgs.python311
    pkgs.python311Packages.django
    pkgs.python311Packages.psycopg2
    pkgs.python311Packages.pip
  ];
}